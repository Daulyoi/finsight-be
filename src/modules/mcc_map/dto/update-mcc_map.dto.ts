import { PartialType } from '@nestjs/swagger';
import { CreateMccMapDto } from './create-mcc_map.dto';

export class UpdateMccMapDto extends PartialType(CreateMccMapDto) {}
