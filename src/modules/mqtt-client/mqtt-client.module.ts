import { Module } from '@nestjs/common';
import { MQTTClientController } from './mqtt-client.controller';
import { MqttClientService } from './mqtt-client.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../device/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [MQTTClientController],
  providers: [MqttClientService],
  exports: [MqttClientService],
})
export class MQTTClientModule {}
