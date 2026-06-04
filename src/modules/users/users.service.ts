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

  async getUserBalance(userId: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COALESCE(SUM(saldo), 0) as balance FROM rekening WHERE id_nasabah = $1`,
      [userId],
    );
    return Number(result[0]?.balance || 0);
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

  async updateUserRatios(userId: string, needs: number, wants: number): Promise<void> {
    await this.nasabahRepository.update(userId, {
      currentRatioNeeds: needs,
      currentRatioWants: wants,
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

  async getMonthlySummary(userId: string, accessDate: Date = new Date()) {
    const accessDateStr = accessDate.toISOString();
    const query = `
      SELECT 
          r.id_nasabah as "idNasabah",
          DATE_TRUNC('month', t.timestamp) AS bulan,
          COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Kredit' THEN t.nominal ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' THEN t.nominal ELSE 0 END), 0) AS total_spending,
          COALESCE(AVG(CASE WHEN t.tipe_mutasi = 'Kredit' THEN t.nominal END), 0) AS avg_income_per_trx,
          COALESCE(AVG(CASE WHEN t.tipe_mutasi = 'Debit' THEN t.nominal END), 0) AS avg_spending_per_trx
      FROM transaksi t
      INNER JOIN rekening r ON r.id_rekening = t.id_rekening
      WHERE r.id_nasabah = $1
      AND t.timestamp <= CAST($2 AS TIMESTAMP)
      GROUP BY r.id_nasabah, DATE_TRUNC('month', t.timestamp)
      ORDER BY 2 DESC;
    `;
    const result = await this.dataSource.query(query, [userId, accessDateStr]);
    return result.map(row => ({
      bulan: row.bulan,
      totalIncome: parseFloat(row.total_income) || 0,
      totalSpending: parseFloat(row.total_spending) || 0,
      avgIncomePerTrx: parseFloat(row.avg_income_per_trx) || 0,
      avgSpendingPerTrx: parseFloat(row.avg_spending_per_trx) || 0,
    }));
  }

  async getDailySpendingStats(userId: string, accessDate: Date = new Date()) {
    const accessDateStr = accessDate.toISOString();
    const query = `
      WITH month_stats AS (
          SELECT 
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Kredit' THEN t.nominal ELSE 0 END), 0) AS total_income,
              COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' THEN t.nominal ELSE 0 END), 0) AS total_spending,
              COALESCE(COUNT(DISTINCT DATE(t.timestamp)), 0) AS days_active
          FROM transaksi t
          INNER JOIN rekening r ON r.id_rekening = t.id_rekening
          WHERE r.id_nasabah = $1
          AND t.timestamp >= DATE_TRUNC('month', CAST($2 AS TIMESTAMP))
          AND t.timestamp <= CAST($2 AS TIMESTAMP)
      )
      SELECT 
          COALESCE(total_spending::numeric / NULLIF(days_active, 0), 0) AS avg_daily_spending,
          COALESCE((total_spending::numeric / NULLIF(days_active, 0)) / NULLIF(total_income, 0) * 100, 0) AS daily_spending_to_income_ratio
      FROM month_stats;
    `;
    const result = await this.dataSource.query(query, [userId, accessDateStr]);
    if (result && result.length > 0) {
      return {
        avgDailySpending: parseFloat(result[0].avg_daily_spending) || 0,
        dailySpendingToIncomeRatio: parseFloat(result[0].daily_spending_to_income_ratio) || 0,
      };
    }
    return {
      avgDailySpending: 0,
      dailySpendingToIncomeRatio: 0,
    };
  }

  async getCumulativeFlow(userId: string, accessDate: Date = new Date()) {
    const accessDateStr = accessDate.toISOString();
    const query = `
      SELECT 
          t.timestamp as timestamp,
          t.tipe_mutasi AS tipe_mutasi,
          t.nominal AS nominal,
          COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Debit' THEN t.nominal ELSE 0 END) 
              OVER (PARTITION BY r.id_nasabah, DATE_TRUNC('month', t.timestamp) ORDER BY t.timestamp), 0) AS cumulative_spending,
          COALESCE(SUM(CASE WHEN t.tipe_mutasi = 'Kredit' THEN t.nominal ELSE 0 END) 
              OVER (PARTITION BY r.id_nasabah, DATE_TRUNC('month', t.timestamp) ORDER BY t.timestamp), 0) AS cumulative_income
      FROM transaksi t
      INNER JOIN rekening r ON r.id_rekening = t.id_rekening
      WHERE r.id_nasabah = $1
      AND t.timestamp >= DATE_TRUNC('month', CAST($2 AS TIMESTAMP))
      AND t.timestamp <= CAST($2 AS TIMESTAMP)
      ORDER BY t.timestamp ASC;
    `;
    const result = await this.dataSource.query(query, [userId, accessDateStr]);
    return result.map(row => ({
      timestamp: row.timestamp,
      tipeMutasi: row.tipe_mutasi,
      nominal: parseFloat(row.nominal) || 0,
      cumulativeSpending: parseFloat(row.cumulative_spending) || 0,
      cumulativeIncome: parseFloat(row.cumulative_income) || 0,
    }));
  }

  async getCategoryBreakdown(userId: string, accessDate: Date = new Date()) {
    const accessDateStr = accessDate.toISOString();
    const query = `
      WITH category_totals AS (
          SELECT 
              t.kategori_detail AS kategori_detail,
              SUM(t.nominal) AS total_amount
          FROM transaksi t
          INNER JOIN rekening r ON r.id_rekening = t.id_rekening
          WHERE r.id_nasabah = $1
          AND t.tipe_mutasi = 'Debit'
          AND t.timestamp >= DATE_TRUNC('month', CAST($2 AS TIMESTAMP))
          AND t.timestamp <= CAST($2 AS TIMESTAMP)
          GROUP BY t.kategori_detail
      ),
      ranked_categories AS (
          SELECT 
              kategori_detail,
              total_amount,
              ROW_NUMBER() OVER (ORDER BY total_amount DESC) as rank
          FROM category_totals
      )
      SELECT 
          CASE WHEN rank <= 3 THEN COALESCE(kategori_detail, 'Lainnya') ELSE 'Lainnya' END AS category,
          SUM(total_amount) AS amount
      FROM ranked_categories
      GROUP BY 1
      ORDER BY 2 DESC;
    `;
    const result = await this.dataSource.query(query, [userId, accessDateStr]);
    return result.map(row => ({
      category: row.category,
      amount: parseFloat(row.amount) || 0,
    }));
  }
}
