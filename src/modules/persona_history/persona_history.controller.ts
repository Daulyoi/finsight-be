import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PersonaHistoryService } from './persona_history.service';
import { CreatePersonaHistoryDto } from './dto/create-persona_history.dto';
import { UpdatePersonaHistoryDto } from './dto/update-persona_history.dto';

@Controller('persona-history')
export class PersonaHistoryController {
  constructor(private readonly personaHistoryService: PersonaHistoryService) {}

  @Post()
  create(@Body() createPersonaHistoryDto: CreatePersonaHistoryDto) {
    return this.personaHistoryService.create(createPersonaHistoryDto);
  }

  @Get()
  findAll() {
    return this.personaHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personaHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonaHistoryDto: UpdatePersonaHistoryDto) {
    return this.personaHistoryService.update(+id, updatePersonaHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personaHistoryService.remove(+id);
  }
}
