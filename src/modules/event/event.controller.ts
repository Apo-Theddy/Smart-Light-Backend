import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDTO } from './create-event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) { }

  @Post()
  async createEvent(@Body() dto: CreateEventDTO) {
    const event = await this.service.createEvent(
      dto.title,
      dto.deviceId,
      dto.description,
    );
    return event;
  }

  @Get()
  async getAllEvents() {
    const events = await this.service.getAllEvents();
    return events;
  }

  @Get('/:id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    const event = await this.service.getEventById(id);
    return event;
  }

  @Get('/device/:deviceId')
  async getByDeviceId(@Param('deviceId', ParseIntPipe) deviceId: number) {
    const events = await this.service.getByDeviceId(deviceId);
    return events;
  }

  @Post('/analytics/devices/all')
  @HttpCode(HttpStatus.OK)
  async getAnalyticsEvents(@Body() dto: { deviceIds: number[] }): Promise<any> {
    return await this.service.getAnalyticsEvents(dto.deviceIds);
  }
}
