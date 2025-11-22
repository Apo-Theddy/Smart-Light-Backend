import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ColorDto } from './create-led.dto';
import { Type } from 'class-transformer';

export class UpdateLedStateDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isOn: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ColorDto)
  color: ColorDto;

  @IsOptional()
  @IsNumber()
  brightness: number;

  @IsOptional()
  @IsNumber()
  pin: number;
}
