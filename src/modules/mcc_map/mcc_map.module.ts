import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MccMapService } from './mcc_map.service';
import { MccMapController } from './mcc_map.controller';
import { MccMap } from './entities/mcc_map.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MccMap])],
  controllers: [MccMapController],
  providers: [MccMapService],
  exports: [TypeOrmModule],
})
export class MccMapModule {}
