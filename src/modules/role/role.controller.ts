import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dtos/create-role.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get(':name')
  async getByName(@Param('name') name: string) {
    return this.roleService.findByName(name);
  }

  @Post()
  async create(@Body() body: CreateRoleDto) {
    return this.roleService.create(body.name);
  }

  @Get('/')
  async findAll() {
    return this.roleService.findAll();
  }
}
