import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { ReportsService } from './reports.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly reportsService: ReportsService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('59 16 * * 0')
  async triggerWeeklyReport() {
    this.logger.log('Triggering weekly scheduler...');
    const fastApiUrl = this.config.get<string>('FASTAPI_URL') || this.config.get<string>('AI_SERVICE_URL') || 'http://localhost:8002';
    const apiKey = this.config.get<string>('FASTAPI_INTERNAL_KEY') || 'secret_internal_key';
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${fastApiUrl}/scheduler/weekly`,
          { user_ids: [], dry_run: false },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Key': apiKey,
            },
            timeout: 10000,
          },
        ),
      );
      this.logger.log(`Weekly job queued successfully on FastAPI: ${response.data?.job_id}`);
    } catch (err: any) {
      this.logger.warn(`FastAPI weekly scheduler call failed (${err.message}). Entering local mock fallback mode...`);
      await this.runLocalWeeklyFallback();
    }
  }

  @Cron('59 16 L * *')
  async triggerMonthlyReport() {
    this.logger.log('Triggering monthly scheduler...');
    const fastApiUrl = this.config.get<string>('FASTAPI_URL') || this.config.get<string>('AI_SERVICE_URL') || 'http://localhost:8002';
    const apiKey = this.config.get<string>('FASTAPI_INTERNAL_KEY') || 'secret_internal_key';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${fastApiUrl}/scheduler/monthly`,
          { user_ids: [], dry_run: false },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Key': apiKey,
            },
            timeout: 10000,
          },
        ),
      );
      this.logger.log(`Monthly job queued successfully on FastAPI: ${response.data?.job_id}`);
    } catch (err: any) {
      this.logger.warn(`FastAPI monthly scheduler call failed (${err.message}). Entering local mock fallback mode...`);
      await this.runLocalMonthlyFallback();
    }
  }

  @Cron('0 17 L * *')
  async resetMonthlyRatios() {
    this.logger.log('Resetting monthly ratios to 0...');
    try {
      await this.dataSource.query(
        `UPDATE nasabah SET current_ratio_needs = 0, current_ratio_wants = 0`
      );
      this.logger.log('Monthly ratios reset successfully.');
    } catch (err: any) {
      this.logger.error(`Failed to reset monthly ratios: ${err.message}`);
    }
  }

  private async runLocalWeeklyFallback() {
    try {
      const users = await this.dataSource.query(`SELECT id_nasabah as "idNasabah" FROM nasabah`);
      for (const u of users) {
        await this.reportsService.generateMockWeeklyReport(u.idNasabah);
        this.logger.log(`Generated local fallback weekly report for user ${u.idNasabah}`);
      }
    } catch (e: any) {
      this.logger.error(`Local weekly fallback failed: ${e.message}`);
    }
  }

  private async runLocalMonthlyFallback() {
    try {
      const users = await this.dataSource.query(`SELECT id_nasabah as "idNasabah" FROM nasabah`);
      for (const u of users) {
        await this.reportsService.generateMockMonthlyReport(u.idNasabah);
        this.logger.log(`Generated local fallback monthly report for user ${u.idNasabah}`);
      }
    } catch (e: any) {
      this.logger.error(`Local monthly fallback failed: ${e.message}`);
    }
  }
}
