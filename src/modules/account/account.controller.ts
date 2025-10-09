import { Body, Controller, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('register')
  async register(@Body() dto: CreateAccountDto) {
    return this.accountService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.accountService.login(dto.email, dto.password);
  }
}
