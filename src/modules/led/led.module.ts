import { Module } from '@nestjs/common';
import { Led } from './led.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedService } from './led.service';
import { LedController } from './led.controller';
import { MQTTClientModule } from '../mqtt-client/mqtt-client.module';

@Module({
  imports: [TypeOrmModule.forFeature([Led]), MQTTClientModule],
  controllers: [LedController],
  providers: [LedService],
  exports: [LedService],
})
export class LedModule {}
