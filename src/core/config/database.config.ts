import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export class DatabaseConfig {
  static setup(config: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: config.get<string>('DB_HOST'),
      port: config.get<number>('DB_PORT'),
      username: config.get<string>('DB_USER'),
      password: config.get<string>('DB_PASSWORD'),
      database: config.get<string>('DB_NAME'),
      synchronize: config.get<boolean>('DB_SYNCHRONIZE'),
      logging: config.get<boolean>('DB_LOGGING'),
      autoLoadEntities: true,
    };
  }
}
