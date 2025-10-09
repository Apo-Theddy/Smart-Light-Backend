import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Device } from './device.entity';
import { CreateDeviceDto } from './dtos/create-device.dto';
import { User } from '../user/user.entity';
import { Led } from '../led/led.entity';

@Injectable()
export class DeviceService {
  constructor(private readonly dataSource: DataSource) {}

  async findByMac(mac: string): Promise<Device> {
    return await this.dataSource.transaction(async (manager) => {
      const device = await manager.findOne(Device, {
        where: { mac, deletedAt: IsNull() },
      });
      if (!device) throw new NotFoundException('Device not found');
      return device;
    });
  }

  async create(dto: CreateDeviceDto): Promise<Device> {
    return await this.dataSource.transaction(async (manager) => {
      const existingDevice = await manager.findOne(Device, {
        where: { mac: dto.mac, deletedAt: IsNull() },
      });
      if (existingDevice)
        throw new BadRequestException('Device with this MAC already exists');

      const owner = await manager.findOne(User, {
        where: { id: dto.userId, deletedAt: IsNull() },
      });
      if (!owner) throw new NotFoundException('User not found');

      const device = manager.create(Device, {
        mac: dto.mac,
        name: dto.name,
        owner,
      });
      return await manager.save(device);
    });
  }

  async findAllUserDevices(userId: number): Promise<Device[]> {
    return await this.dataSource.transaction(async (manager) => {
      const devices = await manager.find(Device, {
        where: { owner: { id: userId }, deletedAt: IsNull() },
        relations: ['owner'],
      });
      return devices;
    });
  }

  async findLedsByDeviceId(deviceId: number): Promise<Device> {
    return await this.dataSource.transaction(async (manager) => {
      const device = await manager.findOne(Device, {
        where: { id: deviceId, deletedAt: IsNull() },
        relations: ['deviceHasLeds'],
      });
      if (!device) throw new NotFoundException('Device not found');
      return device;
    });
  }
}
