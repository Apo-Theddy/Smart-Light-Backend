import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LedService } from './led.service';
import { CreateLedDto } from './dtos/create-led.dto';
import { UpdateLedStateDto } from './dtos/update-led-state.dto';

@Controller('leds')
export class LedController {
  constructor(private readonly ledService: LedService) {}

  @Post()
  async create(@Body() body: CreateLedDto) {
    return this.ledService.create(body);
  }

  @Patch(':id/state')
  async updateLedState(
    @Param('id') id: number,
    @Body() body: UpdateLedStateDto,
  ) {
    return this.ledService.updateLedState(id, body.isOn);
  }
}
