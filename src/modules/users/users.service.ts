import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Nasabah } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Nasabah)
    private readonly nasabahRepository: Repository<Nasabah>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<Nasabah | null> {
    return this.nasabahRepository.findOne({ where: { idNasabah: id } });
  }

  async findByEmail(email: string): Promise<Nasabah | null> {
    return this.nasabahRepository.findOne({ where: { email } });
  }

  async createNasabah(data: Partial<Nasabah>): Promise<Nasabah> {
    const nasabah = this.nasabahRepository.create(data);
    return this.nasabahRepository.save(nasabah);
  }

  async updateNasabah(id: string, data: UpdateUserDto): Promise<Nasabah> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (data.namaNasabah !== undefined) {
      user.namaNasabah = data.namaNasabah;
    }
    if (data.gajiBulanan !== undefined) {
      user.gajiBulanan = data.gajiBulanan !== null ? String(data.gajiBulanan) : null;
    }
    if (data.isDynamic !== undefined) {
      user.isDynamic = data.isDynamic;
    }

    return this.nasabahRepository.save(user);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.nasabahRepository.update(id, {
      currentHashedRefreshToken: token,
    });
  }

  async getFinancialRatios(userId: string, accessDate: Date = new Date()) {
    const accessDateStr = accessDate.toISOString();

    const query = `
      WITH current_month AS (
          SELECT 
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Kredit' THEN t.nominal ELSE 0 END), 0) AS income,
              -- Wants: Semua kategori besar Wants kecuali Investasi
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' AND t.kategori_besar = 'Wants' 
                       AND t.kategori_detail != 'Investasi & Finansial' THEN t.nominal ELSE 0 END), 0) AS total_wants,
              -- Needs: Semua kategori besar Needs kecuali Investasi
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' AND t.kategori_besar = 'Needs' 
                       AND t.kategori_detail != 'Investasi & Finansial' THEN t.nominal ELSE 0 END), 0) AS total_needs,
              -- Savings: Khusus kategori detail Investasi & Finansial
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' AND t.kategori_detail = 'Investasi & Finansial' THEN t.nominal ELSE 0 END), 0) AS total_savings,
              -- Total Spending: Semua Debit
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' THEN t.nominal ELSE 0 END), 0) AS total_spending
          FROM transaksi t
          INNER JOIN rekening r ON r.id_rekening = t.id_rekening
          WHERE r.id_nasabah = $1
          AND t.timestamp >= DATE_TRUNC('month', CAST($2 AS TIMESTAMP))
          AND t.timestamp <= CAST($2 AS TIMESTAMP)
      )
      SELECT 
          COALESCE(ROUND((total_needs::numeric / NULLIF(income, 0)) * 100, 2), 0) AS needs_percentage,
          COALESCE(ROUND((total_wants::numeric / NULLIF(income, 0)) * 100, 2), 0) AS wants_percentage,
          COALESCE(ROUND((total_savings::numeric / NULLIF(income, 0)) * 100, 2), 0) AS savings_percentage,
          COALESCE(ROUND(((income - total_spending)::numeric / NULLIF(income, 0)) * 100, 2), 0) AS remaining_cash_percentage,
          income,
          total_spending
      FROM current_month;
    `;

    const result = await this.dataSource.query(query, [userId, accessDateStr]);

    if (result && result.length > 0) {
      return {
        needsPercentage: parseFloat(result[0].needs_percentage) || 0,
        wantsPercentage: parseFloat(result[0].wants_percentage) || 0,
        savingsPercentage: parseFloat(result[0].savings_percentage) || 0,
        remainingCashPercentage: parseFloat(result[0].remaining_cash_percentage) || 0,
        currentMonth: {
          income: parseFloat(result[0].income) || 0,
          expense: parseFloat(result[0].total_spending) || 0,
          period: accessDate.toISOString().slice(0, 7), // "YYYY-MM"
        },
      };
    }

    return {
      needsPercentage: 0,
      wantsPercentage: 0,
      savingsPercentage: 0,
      remainingCashPercentage: 0,
      currentMonth: {
        income: 0,
        expense: 0,
        period: accessDate.toISOString().slice(0, 7),
      },
    };
  }
}
