import { Test, TestingModule } from '@nestjs/testing';
import { PersonaHistoryService } from './persona_history.service';

describe('PersonaHistoryService', () => {
  let service: PersonaHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonaHistoryService],
    }).compile();

    service = module.get<PersonaHistoryService>(PersonaHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
