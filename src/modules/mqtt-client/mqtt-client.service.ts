import {
  ClientProxyFactory,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class MqttClientService implements OnModuleInit {
  private client: ClientProxy;

  constructor() {}

  async onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.MQTT,
      options: {
        url: process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883',
      },
    });
    await this.client.connect();
  }

  publish(topic: string, data: any) {
    this.client.emit(topic, data);
  }
}
