import { Injectable, NotFoundException } from '@nestjs/common';
import { Led } from './led.entity';
import { DataSource, IsNull } from 'typeorm';
import { CreateLedDto } from './dtos/create-led.dto';
import { Device } from '../device/device.entity';
import { UpdateLedStateDto } from './dtos/update-led-state.dto';
import { MqttClientService } from '../mqtt-client/mqtt-client.service';
import { Event } from '../event/event.entity';

@Injectable()
export class LedService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mqttService: MqttClientService,
  ) { }

  async findAllByDeviceId(deviceId: number): Promise<Led[]> {
    return this.dataSource.getRepository(Led).find({
      where: { deviceHasLeds: { id: deviceId }, deletedAt: IsNull() },
    });
  }

  async findById(id: number): Promise<Led> {
    const led = await this.dataSource.getRepository(Led).findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!led) throw new NotFoundException('Led not found');
    return led;
  }

  async create(dto: CreateLedDto): Promise<Led> {
    return await this.dataSource.transaction(async (manager) => {
      const device = await this.dataSource.getRepository(Device).findOne({
        relations: ['deviceHasLeds'],
        where: { id: dto.deviceId, deletedAt: IsNull() },
      });
      if (!device) throw new NotFoundException('Device not found');

      const led = manager.create(Led, {
        name: dto.name,
        color: dto.color,
        brightness: dto.brightness,
        pin: dto.pin,
      });

      const savedLed = await manager.save(led);
      device.deviceHasLeds.push(savedLed);

      await manager.save(device);
      return savedLed;
    });
  }

  async updateLedState(
    id: number,
    dto: UpdateLedStateDto,
    deviceId: number,
  ): Promise<Led> {
    const data = await this.dataSource.transaction(async (manager) => {
      const led = await manager.findOne(Led, {
        where: { id, deletedAt: IsNull() },
      });
      if (!led) throw new NotFoundException('Led not found');

      // Guardar valores anteriores para el log

      // Actualizar valores
      if (dto.name !== undefined) led.name = dto.name;
      if (dto.color !== undefined) led.color = dto.color;
      if (dto.brightness !== undefined) led.brightness = dto.brightness;
      if (dto.isOn !== undefined) led.isOn = dto.isOn;
      if (dto.pin !== undefined) led.pin = dto.pin;

      // Publicar a MQTT
      this.mqttService.publish('leds/update', {
        id: led.id,
        isOn: led.isOn,
        color: led.color,
        brightness: led.brightness,
        pin: led.pin,
      });
      console.log(`Published LED update to MQTT for LED ID ${led.id}`);

      return await manager.save(led);
    });

    // Crear evento con descripción mejorada
    const repo = this.dataSource.getRepository(Event);
    const event = repo.create({
      title: this.generateEventTitle(dto),
      description: this.generateEventDescription(id, dto, data),
      device: { id: deviceId } as Device,
    });
    await repo.save(event);

    return data;
  }

  private generateEventTitle(dto: UpdateLedStateDto): string {
    if (dto.isOn !== undefined) {
      return dto.isOn ? '💡 LED Encendido' : '🌙 LED Apagado';
    }
    if (dto.brightness !== undefined) {
      return '🔆 Brillo Ajustado';
    }
    if (dto.color !== undefined) {
      return '🎨 Color Cambiado';
    }
    if (dto.name !== undefined) {
      return '✏️ LED Renombrado';
    }
    if (dto.pin !== undefined) {
      return '🔌 Pin Actualizado';
    }
    return '⚡ LED Actualizado';
  }

  private generateEventDescription(
    id: number,
    dto: UpdateLedStateDto,
    updatedLed: Led,
  ): string {
    const changes: string[] = [];

    if (dto.isOn !== undefined) {
      changes.push(`  • Estado: ${dto.isOn ? '🟢 Encendido' : '🔴 Apagado'}`);
    }
    if (dto.brightness !== undefined) {
      changes.push(`  • Brillo: ☀️ ${dto.brightness}%`);
    }
    if (dto.color !== undefined) {
      changes.push(
        `  • Color: 🎨 ${typeof dto.color === 'object' ? JSON.stringify(dto.color) : dto.color}`,
      );
    }
    if (dto.name !== undefined) {
      changes.push(`  • Nombre: 📝 ${dto.name}`);
    }
    if (dto.pin !== undefined) {
      changes.push(`  • Pin: 🔌 GPIO ${dto.pin}`);
    }

    const changeLog = changes.length > 0 ? `\n${changes.join('\n')}` : '';

    return `LED #${id} "${updatedLed.name}" fue modificado:${changeLog}`;
  }
}
