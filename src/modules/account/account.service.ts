import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Account } from './account.entity';
import { User } from '../user/user.entity';
import { CreateAccountDto } from './dtos/create-account.dto';
import * as bcryptjs from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Role } from '../role/role.entity';

@Injectable()
export class AccountService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: CreateAccountDto): Promise<Account> {
    return await this.dataSource.transaction(async (manager) => {
      const existingAccountEmail = await manager.findOne(Account, {
        where: { email: dto.email },
      });
      if (existingAccountEmail)
        throw new BadRequestException('Email already registered');

      const existingUserPhone = await manager.findOne(User, {
        where: { phone: dto.phone },
      });
      if (existingUserPhone)
        throw new BadRequestException('Phone number already registered');

      const role = await manager.findOneBy(Role, { name: 'user' });
      if (!role) throw new NotFoundException('Role not found');

      const user = manager.create(User, {
        firstnames: dto.firstnames,
        lastnames: dto.lastnames,
        phone: dto.phone,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
      });
      await manager.save(user);

      const salt = await bcryptjs.genSalt(
        parseInt(this.configService.get('SALT_ROUNDS') || '10'),
      );
      dto.password = bcryptjs.hashSync(dto.password, salt);

      const account = manager.create(Account, {
        email: dto.email,
        password: dto.password,
        user,
        role,
      });
      await manager.save(account);
      return account;
    });
  }

  async login(email: string, password: string): Promise<Account> {
    const account = await this.dataSource.getRepository(Account).findOne({
      where: { email },
    });
    if (!account) throw new NotFoundException('Account not found');
    const isPasswordValid = bcryptjs.compareSync(password, account.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');
    return account;
  }
}
