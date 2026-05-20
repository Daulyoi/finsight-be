import { Test, TestingModule } from '@nestjs/testing';
import { MccMapController } from './mcc_map.controller';
import { MccMapService } from './mcc_map.service';

describe('MccMapController', () => {
  let controller: MccMapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MccMapController],
      providers: [MccMapService],
    }).compile();

    controller = module.get<MccMapController>(MccMapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
