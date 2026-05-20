import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaHistoryService } from './persona_history.service';
import { PersonaHistoryController } from './persona_history.controller';
import { SejarahPersona } from './entities/persona_history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SejarahPersona])],
  controllers: [PersonaHistoryController],
  providers: [PersonaHistoryService],
  exports: [TypeOrmModule],
})
export class PersonaHistoryModule {}
