import { Injectable } from '@nestjs/common';
import { CreateMccMapDto } from './dto/create-mcc_map.dto';
import { UpdateMccMapDto } from './dto/update-mcc_map.dto';

@Injectable()
export class MccMapService {
  create(createMccMapDto: CreateMccMapDto) {
    return 'This action adds a new mccMap';
  }

  findAll() {
    return `This action returns all mccMap`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mccMap`;
  }

  update(id: number, updateMccMapDto: UpdateMccMapDto) {
    return `This action updates a #${id} mccMap`;
  }

  remove(id: number) {
    return `This action removes a #${id} mccMap`;
  }
}
