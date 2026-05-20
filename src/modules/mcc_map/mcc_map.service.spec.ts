import { Test, TestingModule } from '@nestjs/testing';
import { MccMapService } from './mcc_map.service';

describe('MccMapService', () => {
  let service: MccMapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MccMapService],
    }).compile();

    service = module.get<MccMapService>(MccMapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
