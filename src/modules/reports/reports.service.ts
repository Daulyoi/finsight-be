import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { MonthlyReport } from './entities/monthly-report.entity';
import { DetectedAnomaly } from './entities/detected-anomaly.entity';
import { Nasabah } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WeeklyReport)
    private readonly weeklyReportRepository: Repository<WeeklyReport>,
    @InjectRepository(MonthlyReport)
    private readonly monthlyReportRepository: Repository<MonthlyReport>,
    @InjectRepository(DetectedAnomaly)
    private readonly detectedAnomalyRepository: Repository<DetectedAnomaly>,
    @InjectRepository(Nasabah)
    private readonly nasabahRepository: Repository<Nasabah>,
    private readonly usersService: UsersService,
  ) {}

  async findAllWeekly(userId: string): Promise<WeeklyReport[]> {
    return this.weeklyReportRepository.find({
      where: { userId },
      order: { reportDate: 'DESC' },
    });
  }

  async findWeeklyById(id: string, userId: string): Promise<WeeklyReport> {
    const report = await this.weeklyReportRepository.findOne({
      where: { id, userId },
    });
    if (!report) {
      throw new NotFoundException(`Weekly report with ID ${id} not found`);
    }
    return report;
  }

  async findAllMonthly(userId: string): Promise<MonthlyReport[]> {
    return this.monthlyReportRepository.find({
      where: { userId },
      order: { targetMonth: 'DESC' },
    });
  }

  async findMonthlyById(id: string, userId: string): Promise<MonthlyReport> {
    const report = await this.monthlyReportRepository.findOne({
      where: { id, userId },
    });
    if (!report) {
      throw new NotFoundException(`Monthly report with ID ${id} not found`);
    }
    return report;
  }

  async generateMockWeeklyReport(userId: string, refDate: Date = new Date()): Promise<WeeklyReport> {
    const user = await this.nasabahRepository.findOne({ where: { idNasabah: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const ratios = await this.usersService.getFinancialRatios(userId, refDate);
    
    // Calculate dates
    const end = new Date(refDate);
    const start = new Date(refDate);
    start.setDate(end.getDate() - 7);

    const periodStart = start.toISOString().split('T')[0];
    const periodEnd = end.toISOString().split('T')[0];
    const reportDate = periodEnd; // Monday/Sunday of report period

    // Persona
    const persona = user.personaDasar || 'Unconflicted';

    const wantsRatio = ratios.wantsPercentage / 100;
    const needsRatio = ratios.needsPercentage / 100;
    const income = ratios.currentMonth.income;
    const totalSpent = ratios.currentMonth.expense;

    const reportText = `Halo, ${user.namaNasabah}!
    
Berikut adalah Laporan Evaluasi Finansial Mingguan Anda untuk periode ${periodStart} s/d ${periodEnd}.

=== RINGKASAN KINERJA KEUANGAN ===
* **Total Pengeluaran**: Rp ${totalSpent.toLocaleString('id-ID')}
* **Rasio Kebutuhan (Needs)**: ${(needsRatio * 100).toFixed(1)}% (Target: 50%)
* **Rasio Keinginan (Wants)**: ${(wantsRatio * 100).toFixed(1)}% (Target: 30%)
* **Rasio Tabungan (Savings)**: ${(ratios.savingsPercentage).toFixed(1)}% (Target: 20%)

=== DIAGNOSA AI COACH ===
Berdasarkan aktivitas pengeluaran Anda, Anda masuk ke dalam kategori persona **${persona}**. Pengeluaran Anda berada dalam batas kendali yang wajar. Kami mendeteksi Anda telah membagi alokasi gaji dengan cukup seimbang minggu ini. Namun, harap berhati-hati pada pengeluaran kategori F&B (makanan & minuman) serta belanja retail yang cenderung berulang.

=== SASARAN & REKOMENDASI MINGGU DEPAN ===
1. **Kurangi jajan impulsif**: Pengeluaran makan luar/kafe dapat ditekan hingga 15% dengan masak di rumah.
2. **Prioritaskan Tabungan Pertama**: Salurkan 20% penghasilan langsung ke rekening investasi sesaat setelah menerima gaji/pendapatan.
3. **Pantau sisa batas belanja harian**: Batasi pengeluaran non-primer maksimal Rp 100.000 per hari untuk sisa periode ini.

Tetap konsisten dan mari wujudkan finansial yang sehat bersama FinSight!`;

    // Check if report already exists for user on this date
    let report = await this.weeklyReportRepository.findOne({ where: { userId, reportDate } });
    if (!report) {
      report = this.weeklyReportRepository.create({
        userId,
        reportDate,
        periodStart,
        periodEnd,
        persona,
        wantsRatio,
        needsRatio,
        totalPengeluaran: totalSpent.toString(),
        anomaliCount: 0,
        reportText,
      });
    } else {
      report.persona = persona;
      report.wantsRatio = wantsRatio;
      report.needsRatio = needsRatio;
      report.totalPengeluaran = totalSpent.toString();
      report.reportText = reportText;
    }

    return this.weeklyReportRepository.save(report);
  }

  async generateMockMonthlyReport(userId: string, targetMonth?: string): Promise<MonthlyReport> {
    const user = await this.nasabahRepository.findOne({ where: { idNasabah: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const now = new Date();
    const monthStr = targetMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ratios = await this.usersService.getFinancialRatios(userId, now);

    const wantsRatio = ratios.wantsPercentage / 100;
    const needsRatio = ratios.needsPercentage / 100;
    const income = ratios.currentMonth.income;
    const totalSpent = ratios.currentMonth.expense;
    
    const wantsAmount = Math.round(totalSpent * wantsRatio);
    const needsAmount = Math.round(totalSpent * needsRatio);
    const savingsAmount = Math.round(income * (ratios.savingsPercentage / 100));

    const personaBaru = user.personaDasar || 'Unconflicted';
    const personaLama = user.personaDasar || 'Unconflicted';
    const savingsRate = ratios.savingsPercentage / 100;

    const reportText = `Halo, ${user.namaNasabah}!
    
Laporan Penasihat Finansial Bulanan Anda untuk periode bulan ${monthStr} telah siap.

=== EVALUASI BULANAN AI ADVISOR ===
* **Total Pemasukan**: Rp ${income.toLocaleString('id-ID')}
* **Total Pengeluaran**: Rp ${totalSpent.toLocaleString('id-ID')}
* **Alokasi Keinginan (Wants)**: Rp ${wantsAmount.toLocaleString('id-ID')} (${ratios.wantsPercentage.toFixed(1)}%)
* **Alokasi Kebutuhan (Needs)**: Rp ${needsAmount.toLocaleString('id-ID')} (${ratios.needsPercentage.toFixed(1)}%)
* **Total Tabungan & Investasi**: Rp ${savingsAmount.toLocaleString('id-ID')} (${ratios.savingsPercentage.toFixed(1)}%)

=== ANALISIS PERILAKU & PERSONA ===
Persona Anda bulan ini adalah **${personaBaru}** (Persona Sebelumnya: **${personaLama}**). 
Indikator Tabungan (Savings Rate) Anda tercatat sebesar ${(savingsRate * 100).toFixed(1)}%. Pengeluaran bulanan Anda menunjukkan volatilitas yang stabil. Anda berhasil menahan diri dari lonjakan belanja di akhir pekan (weekend surge) dan menjaga sisa saldo Anda berada di atas zona darurat (tanggal tua aman).

=== REKOMENDASI BULAN DEPAN ===
1. **Optimalkan Dana Darurat**: Pastikan setidaknya 3 kali pengeluaran bulanan disimpan di rekening likuid terpisah.
2. **Kendalikan 'Bocor Halus'**: Catat pengeluaran kecil di bawah Rp 30.000 yang seringkali menumpuk tanpa disadari.
3. **Investasi Konsisten**: Mulailah melakukan pemotongan otomatis (auto-debit) ke reksa dana di minggu pertama setiap bulan.

Mari pertahankan kebiasaan baik ini di bulan baru!`;

    let report = await this.monthlyReportRepository.findOne({ where: { userId, targetMonth: monthStr } });
    if (!report) {
      report = this.monthlyReportRepository.create({
        userId,
        targetMonth: monthStr,
        persona: personaBaru,
        personaSebelum: personaLama,
        savingsRate,
        wantsRatio,
        needsRatio,
        wantsAmount: wantsAmount.toString(),
        needsAmount: needsAmount.toString(),
        savingsAmount: savingsAmount.toString(),
        behavioralFeatures: {
          wants_frequency: 0.25,
          small_leaks_ratio: 0.12,
          night_owl_spending: 0.05,
          weekend_surge: 1.2,
          early_month_depletion: 0.1,
          balance_volatility: 0.15,
          survival_mode_days: 0,
        },
        reportText,
      });
    } else {
      report.persona = personaBaru;
      report.personaSebelum = personaLama;
      report.savingsRate = savingsRate;
      report.wantsRatio = wantsRatio;
      report.needsRatio = needsRatio;
      report.wantsAmount = wantsAmount.toString();
      report.needsAmount = needsAmount.toString();
      report.savingsAmount = savingsAmount.toString();
      report.reportText = reportText;
    }

    return this.monthlyReportRepository.save(report);
  }
}
