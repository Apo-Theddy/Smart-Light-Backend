import { Body, Controller, Post } from '@nestjs/common';
import { EventPattern, Payload, MessagePattern } from '@nestjs/microservices';
import { MqttClientService } from './mqtt-client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '../device/device.entity';
import { Repository } from 'typeorm';
import type { DeviceStatusPayload } from './device-status.model';

@Controller('mqtt')
export class MQTTClientController {
  constructor(
    private readonly service: MqttClientService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  @Post('publish')
  publishMessage(@Body() body: any) {
    const { topic, ...rest } = body;
    this.service.publish(topic, rest);
  }

  @MessagePattern('device/status')
  async handleDeviceStatus(@Payload() data: DeviceStatusPayload) {
    const mac = data['mac'];
    const device = await this.deviceRepository.findOneBy({ mac });
    if (!device) {
      console.warn(`Device with MAC ${mac} not found.`);
      return;
    }

    const isOnline = data['status'] === 'online';
    device.isOnline = isOnline;
    await this.deviceRepository.save(device);

    console.log('Received device status:', data);
  }

  @EventPattern('leds/update')
  handleTestTopic(@Payload() data: any) {
    console.log('Received data:', data);
  }
}
