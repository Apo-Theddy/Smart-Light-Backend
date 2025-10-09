import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './core/config/database.config';
import { AccountModule } from './modules/account/account.module';
import { DeviceModule } from './modules/device/device.module';
import { EventModule } from './modules/event/event.module';
import { GroupModule } from './modules/group/group.module';
import { LedModule } from './modules/led/led.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';
import { MQTTClientModule } from './modules/mqtt-client/mqtt-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        DatabaseConfig.setup(configService),
    }),
    AccountModule,
    DeviceModule,
    EventModule,
    GroupModule,
    LedModule,
    RoleModule,
    UserModule,
    MQTTClientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
