import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async findByName(name: string): Promise<Role | null> {
    const role = await this.repository.findOne({ where: { name } });
    return role;
  }

  async create(name: string): Promise<Role> {
    const existingRole = await this.findByName(name);
    if (existingRole) throw new Error('Role already exists');
    const role = this.repository.create({ name });
    return this.repository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.repository.find();
  }
}
