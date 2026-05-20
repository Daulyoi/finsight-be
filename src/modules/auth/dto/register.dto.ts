import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  idNasabah!: string;

  @IsNotEmpty()
  @IsString()
  namaNasabah!: string;

  @IsNotEmpty()
  @IsDateString()
  tanggalLahir!: string;

  @IsNotEmpty()
  @IsString()
  namaIbuKandung!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsNumber()
  gajiBulanan?: number;
}
