import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mac: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
