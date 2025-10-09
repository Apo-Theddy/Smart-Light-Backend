import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ColorDto {
  @IsInt()
  r: number;

  @IsInt()
  g: number;

  @IsInt()
  b: number;
}

export class CreateLedDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ColorDto)
  color?: ColorDto;

  @IsOptional()
  @IsNumber()
  brightness?: number;

  @IsNotEmpty()
  @IsNumber()
  pin: number;

  @IsNotEmpty()
  @IsNumber()
  deviceId: number;
}
