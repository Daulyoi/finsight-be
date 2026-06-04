import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  idRekening!: string;

  @IsNotEmpty()
  @IsNumber()
  nominal!: number;

  @IsNotEmpty()
  @IsString()
  tipeMutasi!: string;

  @IsOptional()
  @IsString()
  deskripsiMutasi?: string;

  @IsOptional()
  @IsString()
  catatanMutasi?: string;

  @IsOptional()
  @IsString()
  idMcc?: string;
}
