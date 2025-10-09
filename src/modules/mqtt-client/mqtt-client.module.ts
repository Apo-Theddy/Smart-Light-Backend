import { Module } from '@nestjs/common';
import { MQTTClientController } from './mqtt-client.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MqttClientService } from './mqtt-client.service';

@Module({
  controllers: [MQTTClientController],
  providers: [MqttClientService],
  exports: [MqttClientService],
})
export class MQTTClientModule {}
