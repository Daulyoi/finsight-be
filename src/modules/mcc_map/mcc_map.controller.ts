import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MccMapService } from './mcc_map.service';
import { CreateMccMapDto } from './dto/create-mcc_map.dto';
import { UpdateMccMapDto } from './dto/update-mcc_map.dto';

@Controller('mcc-map')
export class MccMapController {
  constructor(private readonly mccMapService: MccMapService) {}

  @Post()
  create(@Body() createMccMapDto: CreateMccMapDto) {
    return this.mccMapService.create(createMccMapDto);
  }

  @Get()
  findAll() {
    return this.mccMapService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mccMapService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMccMapDto: UpdateMccMapDto) {
    return this.mccMapService.update(+id, updateMccMapDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mccMapService.remove(+id);
  }
}
