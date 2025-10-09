import { Module } from '@nestjs/common';
import { Led } from './led.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedService } from './led.service';
import { LedController } from './led.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Led])],
  controllers: [LedController],
  providers: [LedService],
  exports: [LedService],
})
export class LedModule {}
