import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dtos/create-device.dto';

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get(':mac')
  async getByMac(@Param('mac') mac: string) {
    return this.deviceService.findByMac(mac);
  }

  @Post()
  async create(@Body() body: CreateDeviceDto) {
    return this.deviceService.create(body);
  }

  @Get('users/:userId')
  async findUserDevices(@Param('userId') userId: number) {
    return this.deviceService.findAllUserDevices(userId);
  }

  @Get('/leds/:deviceId')
  async findLedsByDeviceId(@Param('deviceId') deviceId: number) {
    return this.deviceService.findLedsByDeviceId(deviceId);
  }
}
