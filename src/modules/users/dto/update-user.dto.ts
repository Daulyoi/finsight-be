import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  namaNasabah?: string;

  @IsOptional()
  @IsNumber()
  gajiBulanan?: number;

  @IsOptional()
  @IsBoolean()
  isDynamic?: boolean;
}
