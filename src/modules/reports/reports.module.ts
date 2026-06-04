import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WeeklyReport } from './entities/weekly-report.entity';
import { MonthlyReport } from './entities/monthly-report.entity';
import { DetectedAnomaly } from './entities/detected-anomaly.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SchedulerService } from './scheduler.service';
import { UsersModule } from '../users/users.module';
import { Nasabah } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeeklyReport, MonthlyReport, DetectedAnomaly, Nasabah]),
    HttpModule,
    UsersModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, SchedulerService],
  exports: [ReportsService, SchedulerService],
})
export class ReportsModule {}
