import {
  ClientProxyFactory,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MqttClientService {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.MQTT,
      options: {
        url: process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883',
      },
    });

    this.client.connect();
  }

  async publish(topic: string, data: any) {
    return this.client.emit(topic, data);
  }
}
