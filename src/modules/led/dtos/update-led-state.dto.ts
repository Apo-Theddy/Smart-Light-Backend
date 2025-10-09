import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateLedStateDto {
  @IsNotEmpty()
  @IsBoolean()
  isOn: boolean;
}
