import { Test, TestingModule } from '@nestjs/testing';
import { PersonaHistoryController } from './persona_history.controller';
import { PersonaHistoryService } from './persona_history.service';

describe('PersonaHistoryController', () => {
  let controller: PersonaHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonaHistoryController],
      providers: [PersonaHistoryService],
    }).compile();

    controller = module.get<PersonaHistoryController>(PersonaHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
