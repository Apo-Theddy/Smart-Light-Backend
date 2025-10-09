import { Get, Injectable, NotFoundException } from '@nestjs/common';
import { Led } from './led.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLedDto } from './dtos/create-led.dto';
import { Device } from '../device/device.entity';

@Injectable()
export class LedService {
  constructor(private readonly dataSource: DataSource) {}

  async findAllByDeviceId(deviceId: number): Promise<Led[]> {
    return this.dataSource.getRepository(Led).find({
      where: { deviceHasLeds: { id: deviceId }, deletedAt: IsNull() },
    });
  }

  async findById(id: number): Promise<Led> {
    const led = await this.dataSource.getRepository(Led).findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!led) throw new NotFoundException('Led not found');
    return led;
  }

  async create(dto: CreateLedDto): Promise<Led> {
    return await this.dataSource.transaction(async (manager) => {
      const device = await this.dataSource.getRepository(Device).findOne({
        relations: ['deviceHasLeds'],
        where: { id: dto.deviceId, deletedAt: IsNull() },
      });
      if (!device) throw new NotFoundException('Device not found');

      const led = manager.create(Led, {
        name: dto.name,
        color: dto.color,
        brightness: dto.brightness,
        pin: dto.pin,
      });

      const savedLed = await manager.save(led);
      device!.deviceHasLeds.push(savedLed);

      await manager.save(device!);
      return savedLed;
    });
  }

  async updateLedState(id: number, isOn: boolean): Promise<Led> {
    return this.dataSource.transaction(async (manager) => {
      const led = await manager.findOne(Led, {
        where: { id, deletedAt: IsNull() },
      });
      if (!led) throw new NotFoundException('Led not found');
      led.isOn = isOn;
      return await manager.save(led);
    });
  }
}
