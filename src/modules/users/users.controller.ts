import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Nasabah } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: Nasabah) {
    const ratios = await this.usersService.getFinancialRatios(user.idNasabah);
    const balance = await this.usersService.getUserBalance(user.idNasabah);
    return {
      idNasabah: user.idNasabah,
      namaNasabah: user.namaNasabah,
      email: user.email,
      tanggalLahir: user.tanggalLahir,
      segmenDemografi: user.segmenDemografi,
      gajiBulanan: user.gajiBulanan,
      personaDasar: user.personaDasar,
      isDynamic: user.isDynamic,
      balance,
      needsPercentage: ratios.needsPercentage,
      wantsPercentage: ratios.wantsPercentage,
      savingsPercentage: ratios.savingsPercentage,
      remainingCashPercentage: ratios.remainingCashPercentage,
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(
    @CurrentUser() user: Nasabah,
    @Body() updateDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateNasabah(
      user.idNasabah,
      updateDto,
    );
    const ratios = await this.usersService.getFinancialRatios(updatedUser.idNasabah);
    const balance = await this.usersService.getUserBalance(updatedUser.idNasabah);
    return {
      idNasabah: updatedUser.idNasabah,
      namaNasabah: updatedUser.namaNasabah,
      email: updatedUser.email,
      tanggalLahir: updatedUser.tanggalLahir,
      segmenDemografi: updatedUser.segmenDemografi,
      gajiBulanan: updatedUser.gajiBulanan,
      personaDasar: updatedUser.personaDasar,
      isDynamic: updatedUser.isDynamic,
      balance,
      needsPercentage: ratios.needsPercentage,
      wantsPercentage: ratios.wantsPercentage,
      savingsPercentage: ratios.savingsPercentage,
      remainingCashPercentage: ratios.remainingCashPercentage,
    };
  }

  @Get('me/dashboard')
  @HttpCode(HttpStatus.OK)
  async getMeDashboard(@CurrentUser() user: Nasabah) {
    const ratios = await this.usersService.getFinancialRatios(user.idNasabah);
    return {
      personaDasar: user.personaDasar,
      needsPercentage: ratios.needsPercentage,
      wantsPercentage: ratios.wantsPercentage,
      savingsPercentage: ratios.savingsPercentage,
      remainingCashPercentage: ratios.remainingCashPercentage,
      currentMonth: ratios.currentMonth,
    };
  }

  @Get('me/dashboard/monthly-summary')
  @HttpCode(HttpStatus.OK)
  async getMonthlySummary(@CurrentUser() user: Nasabah) {
    return this.usersService.getMonthlySummary(user.idNasabah);
  }

  @Get('me/dashboard/daily-spending')
  @HttpCode(HttpStatus.OK)
  async getDailySpending(@CurrentUser() user: Nasabah) {
    return this.usersService.getDailySpendingStats(user.idNasabah);
  }

  @Get('me/dashboard/cumulative-flow')
  @HttpCode(HttpStatus.OK)
  async getCumulativeFlow(@CurrentUser() user: Nasabah) {
    return this.usersService.getCumulativeFlow(user.idNasabah);
  }

  @Get('me/dashboard/category-breakdown')
  @HttpCode(HttpStatus.OK)
  async getCategoryBreakdown(@CurrentUser() user: Nasabah) {
    return this.usersService.getCategoryBreakdown(user.idNasabah);
  }
}
