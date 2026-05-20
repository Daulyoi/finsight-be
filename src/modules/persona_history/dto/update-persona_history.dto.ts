import { PartialType } from '@nestjs/swagger';
import { CreatePersonaHistoryDto } from './create-persona_history.dto';

export class UpdatePersonaHistoryDto extends PartialType(CreatePersonaHistoryDto) {}
