import { Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Nasabah } from '../users/entities/user.entity';

@Controller('users/me/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  async getWeeklyReports(@CurrentUser() user: Nasabah) {
    return this.reportsService.findAllWeekly(user.idNasabah);
  }

  @Get('weekly/:id')
  @HttpCode(HttpStatus.OK)
  async getWeeklyReportById(@CurrentUser() user: Nasabah, @Param('id') id: string) {
    return this.reportsService.findWeeklyById(id, user.idNasabah);
  }

  @Get('monthly')
  @HttpCode(HttpStatus.OK)
  async getMonthlyReports(@CurrentUser() user: Nasabah) {
    return this.reportsService.findAllMonthly(user.idNasabah);
  }

  @Get('monthly/:id')
  @HttpCode(HttpStatus.OK)
  async getMonthlyReportById(@CurrentUser() user: Nasabah, @Param('id') id: string) {
    return this.reportsService.findMonthlyById(id, user.idNasabah);
  }

  @Post('trigger-weekly')
  @HttpCode(HttpStatus.CREATED)
  async triggerWeeklyReportManual(@CurrentUser() user: Nasabah) {
    return this.reportsService.generateMockWeeklyReport(user.idNasabah);
  }

  @Post('trigger-monthly')
  @HttpCode(HttpStatus.CREATED)
  async triggerMonthlyReportManual(@CurrentUser() user: Nasabah) {
    return this.reportsService.generateMockMonthlyReport(user.idNasabah);
  }
}
