import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import {
  EventPattern,
  MqttContext,
  Payload,
  Ctx,
  ClientProxy,
  MessagePattern,
} from '@nestjs/microservices';
import { MqttClient } from 'mqtt';
import { MqttClientService } from './mqtt-client.service';

@Controller('mqtt')
export class MQTTClientController {
  constructor(private readonly service: MqttClientService) {}

  @Post('publish')
  publishMessage(@Body() body: any) {
    const { topic, ...rest } = body;
    console.log(body);
    this.service.publish(topic, rest);
  }

  @MessagePattern('device/status')
  handleDeviceStatus(@Payload() data: any, @Ctx() context: MqttContext) {
    console.log('Received device status:', data);
  }

  @EventPattern('leds/add')
  handleTestTopic(@Payload() data: any, @Ctx() context: MqttContext) {
    console.log('Received data:', data);
  }
}
