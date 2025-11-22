import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDTO {
  @IsString()
  title: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsNumber()
  deviceId: number;
}
