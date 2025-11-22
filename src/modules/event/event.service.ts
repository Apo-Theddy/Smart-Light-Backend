// event.service.ts
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Event } from './event.entity';
import { DataSource } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { createHash } from 'crypto';

interface AnalyticsResponse {
  totalEvents: number;
  mostCommonEventTitle: string;
  anomaliesDetected: boolean;
  anomalyDetails: string;
  overallSummary: string;
}

interface ChunkAnalysis {
  chunkIndex: number;
  eventCount: number;
  anomaliesDetected: boolean;
  anomalyDetails: string;
  summary: string;
  mostCommonTitles: Record<string, number>;
  timeRange: { start: string; end: string };
}

@Injectable()
export class EventService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;
  private readonly logger = new Logger(EventService.name);

  private readonly CHUNK_SIZE = 40;           // Óptimo para Gemini 1.5 Flash
  private readonly MAX_CONCURRENT_CHUNKS = 6; // Ajusta según tu plan/cuota

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY no está definida en .env');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash', // o gemini-2.0-flash-exp si ya lo tienes',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
  }

  // CREATE
  async createEvent(
    title: string,
    deviceId: number,
    description?: string,
  ): Promise<Event> {
    const eventRepo = this.dataSource.getRepository(Event);
    const event = eventRepo.create({
      title,
      description,
      device: { id: deviceId } as any,
    });
    return await eventRepo.save(event);
  }

  // READ ALL
  async getAllEvents(): Promise<
    Array<{
      id: number;
      title: string;
      description?: string;
      deviceId: number;
      createdAt: Date;
    }>
  > {
    const eventRepo = this.dataSource.getRepository(Event);
    const events = await eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.device', 'device')
      .select([
        'event.id',
        'event.title',
        'event.description',
        'event.description',
        'device.id',
        'event.createdAt',
      ])
      .orderBy('event.createdAt', 'DESC')
      .getMany();

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description ?? undefined,
      deviceId: e.device.id,
      createdAt: e.createdAt,
    }));
  }

  // READ BY DEVICE
  async getByDeviceId(deviceId: number) {
    const eventRepo = this.dataSource.getRepository(Event);
    const events = await eventRepo.find({
      where: { device: { id: deviceId } },
      relations: ['device'],
      order: { createdAt: 'DESC' },
    });

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description ?? undefined,
      deviceId: e.device.id,
      createdAt: e.createdAt,
    }));
  }

  async getEventById(id: number): Promise<Event> {
    const eventRepo = this.dataSource.getRepository(Event);
    const event = await eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  // IMPORTANTE: orden ASC para análisis temporal correcto
  async getEventsByDeviceIds(deviceIds: number[]): Promise<Event[]> {
    const eventRepo = this.dataSource.getRepository(Event);
    return await eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.device', 'device')
      .where('device.id IN (:...deviceIds)', { deviceIds })
      .orderBy('event.createdAt', 'ASC') // ASC es clave para detectar secuencias
      .getMany();
  }

  // ANALYTICS PRINCIPAL
  async getAnalyticsEvents(deviceIds: number[]): Promise<AnalyticsResponse> {
    this.logger.log(`Generando analytics para dispositivos: ${deviceIds.join(', ')}`);

    const events = await this.getEventsByDeviceIds(deviceIds);
    const totalEvents = events.length;

    if (totalEvents === 0) {
      return {
        totalEvents: 0,
        mostCommonEventTitle: 'N/A',
        anomaliesDetected: false,
        anomalyDetails: 'No se encontraron eventos',
        overallSummary: 'Sin datos para analizar',
      };
    }

    // Clave de caché segura con hash
    const sortedIds = [...deviceIds].sort((a, b) => a - b).join('-');
    const cacheKey = `analytics:${createHash('sha256')
      .update(`${sortedIds}__${totalEvents}__v4`)
      .digest('hex')}`;

    const cached = await this.cacheManager.get<AnalyticsResponse>(cacheKey);
    if (cached) {
      this.logger.log('Cache hit - devolviendo resultado almacenado');
      return cached;
    }

    // Título más común (sin IA)
    const titleCounts = events.reduce((acc, e) => {
      acc[e.title] = (acc[e.title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonEventTitle =
      Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    // Caso pequeño: análisis directo
    if (totalEvents <= this.CHUNK_SIZE) {
      const single = await this.analyzeSingleChunk(events);
      const result: AnalyticsResponse = {
        totalEvents,
        mostCommonEventTitle,
        anomaliesDetected: single.anomaliesDetected,
        anomalyDetails: single.anomalyDetails,
        overallSummary: single.summary,
      };
      await this.cacheManager.set(cacheKey, result, 86400); // 24h
      return result;
    }

    // Chunking + procesamiento paralelo
    const chunks: Event[][] = [];
    for (let i = 0; i < events.length; i += this.CHUNK_SIZE) {
      chunks.push(events.slice(i, i + this.CHUNK_SIZE));
    }

    this.logger.log(`Dividiendo en ${chunks.length} chunks de máx ${this.CHUNK_SIZE} eventos`);

    const chunkAnalyses: ChunkAnalysis[] = [];

    for (let i = 0; i < chunks.length; i += this.MAX_CONCURRENT_CHUNKS) {
      const batch = chunks.slice(i, i + this.MAX_CONCURRENT_CHUNKS);

      const batchResults = await Promise.all(
        batch.map((chunkEvents, batchIndex) =>
          this.analyzeSingleChunk(chunkEvents, i + batchIndex),
        ),
      );

      chunkAnalyses.push(...batchResults);
      this.logger.log(
        `Batch procesado: ${i + batch.length} / ${chunks.length} chunks`,
      );
    }

    // Merge final con IA
    const final = await this.mergeChunkAnalyses(chunkAnalyses, totalEvents);

    const completeResult: AnalyticsResponse = {
      totalEvents,
      mostCommonEventTitle,
      anomaliesDetected: final.anomaliesDetected,
      anomalyDetails: final.anomalyDetails,
      overallSummary: final.overallSummary,
    };

    await this.cacheManager.set(cacheKey, completeResult, 86400);
    this.logger.log('Analytics generado y cacheado correctamente');
    return completeResult;
  }

  // ANÁLISIS DE UN CHUNK
  private async analyzeSingleChunk(events: Event[], chunkIndex = 0): Promise<ChunkAnalysis> {
    const eventsForAI = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description || null,
      createdAt: e.createdAt.toISOString(),
    }));

    const prompt = `Eres un experto en análisis de eventos IoT y hablas SOLO en español.

Analiza SOLO este chunk de eventos.

Datos:
${JSON.stringify(eventsForAI, null, 2)}

RESPONDE ÚNICAMENTE CON JSON VÁLIDO (nada de markdown, nada de texto extra) EN ESPAÑOL con esta estructura exacta:
{
  "anomaliesDetected": boolean,
  "anomalyDetails": "descripción en español si hay anomalía, si no déjalo vacío como string vacío",
  "summary": "resumen en español del chunk, máximo 200 caracteres",
  "mostCommonTitles": {"Título del evento": cantidad},
  "timeRange": {"start": "2024-...", "end": "2024-..."}
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const rawText = result.response.text();

      // Limpiar posibles bloques de código
      const cleanText = rawText.replace(/```json\n|```/g, '').trim();
      const data = JSON.parse(cleanText);

      return {
        chunkIndex,
        eventCount: events.length,
        anomaliesDetected: !!data.anomaliesDetected,
        anomalyDetails: data.anomalyDetails?.trim() || '',
        summary: data.summary?.trim() || 'Sin resumen disponible',
        mostCommonTitles: data.mostCommonTitles || {},
        timeRange: {
          start: events[0].createdAt.toISOString(),
          end: events[events.length - 1].createdAt.toISOString(),
        },
      };
    } catch (error: any) {
      this.logger.error(`Error analizando chunk ${chunkIndex}`, error.message);
      return {
        chunkIndex,
        eventCount: events.length,
        anomaliesDetected: false,
        anomalyDetails: 'Error interno al analizar este chunk con IA',
        summary: 'Falló análisis parcial',
        mostCommonTitles: {},
        timeRange: {
          start: events[0]?.createdAt.toISOString() || '',
          end: events[events.length - 1]?.createdAt.toISOString() || '',
        },
      };
    }
  }

  // MERGE FINAL
  private async mergeChunkAnalyses(
    chunks: ChunkAnalysis[],
    totalEvents: number,
  ): Promise<Pick<AnalyticsResponse, 'anomaliesDetected' | 'anomalyDetails' | 'overallSummary'>> {
    const mergePrompt = `Tienes ${chunks.length} análisis parciales de eventos IoT (total: ${totalEvents} eventos).

Resumen por chunk:
${chunks
        .map(
          (c) => `
Chunk ${c.chunkIndex + 1} (${c.eventCount} eventos | ${c.timeRange.start} → ${c.timeRange.end}):
Anomalías locales: ${c.anomaliesDetected ? 'SÍ' : 'NO'}
Detalles: ${c.anomalyDetails || 'Ninguna'}
Resumen: ${c.summary}
`.trim(),
        )
        .join('\n\n')}

Tu tarea final:
- Detectar patrones o anomalías que solo se ven al combinar todos los chunks.
- Ejemplos: errores repetidos cada X minutos, caídas progresivas, picos periódicos, etc.

Responde SOLO con JSON válido:
{
  "anomaliesDetected": boolean,
  "anomalyDetails": "descripción clara y breve (máx 500 caracteres)",
  "overallSummary": "resumen ejecutivo del período completo (máx 300 caracteres)"
}`;

    try {
      const result = await this.model.generateContent(mergePrompt);
      const cleanText = result.response.text().replace(/```json\n|```/g, '').trim();
      const data = JSON.parse(cleanText);

      return {
        anomaliesDetected: !!data.anomaliesDetected,
        anomalyDetails: data.anomalyDetails?.trim() || '',
        overallSummary: data.overallSummary?.trim() || 'Análisis completado sin observaciones críticas.',
      };
    } catch (error: any) {
      this.logger.error('Error en merge final con IA', error.message);

      const hasLocal = chunks.some((c) => c.anomaliesDetected);
      return {
        anomaliesDetected: hasLocal,
        anomalyDetails: hasLocal
          ? 'Detectadas anomalías locales. ' +
          chunks
            .filter((c) => c.anomaliesDetected)
            .map((c) => c.anomalyDetails)
            .join('; ')
          : 'Sin anomalías críticas',
        overallSummary: 'Análisis completado con errores en fase final de síntesis.',
      };
    }
  }
}
