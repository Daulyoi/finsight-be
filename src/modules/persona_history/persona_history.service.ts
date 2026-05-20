import { Injectable } from '@nestjs/common';
import { CreatePersonaHistoryDto } from './dto/create-persona_history.dto';
import { UpdatePersonaHistoryDto } from './dto/update-persona_history.dto';

@Injectable()
export class PersonaHistoryService {
  create(createPersonaHistoryDto: CreatePersonaHistoryDto) {
    return 'This action adds a new personaHistory';
  }

  findAll() {
    return `This action returns all personaHistory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} personaHistory`;
  }

  update(id: number, updatePersonaHistoryDto: UpdatePersonaHistoryDto) {
    return `This action updates a #${id} personaHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} personaHistory`;
  }
}
