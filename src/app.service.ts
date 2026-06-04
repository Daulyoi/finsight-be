import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Nasabah } from './modules/users/entities/user.entity';
import { Rekening } from './modules/accounts/entities/account.entity';
import { Transaksi } from './modules/transactions/entities/transaction.entity';
import { MccMap } from './modules/mcc_map/entities/mcc_map.entity';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async onApplicationBootstrap() {
    this.logger.log('Checking database seed status...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 1. Seed MCC Map if empty
      const mccCount = await queryRunner.manager.count(MccMap);
      if (mccCount === 0) {
        this.logger.log('Seeding MCC Map...');
        const mccData = [
          { mccId: 'MCC-001', mccNumber: 5812 }, // F&B
          { mccId: 'MCC-002', mccNumber: 5311 }, // Shopping
          { mccId: 'MCC-003', mccNumber: 4121 }, // Transport
          { mccId: 'MCC-004', mccNumber: 4899 }, // Bills / Subscription
        ];
        await queryRunner.manager.save(MccMap, mccData);
      }

      // 2. Check if Demo User exists
      const demoUser = await queryRunner.manager.findOne(Nasabah, {
        where: { email: 'demo@finsight.com' },
      });

      if (!demoUser) {
        this.logger.log('Creating demo user (demo@finsight.com)...');

        const hashedPassword = await bcrypt.hash('password', 10);
        const newDemoUser = queryRunner.manager.create(Nasabah, {
          idNasabah: 'USR-DEMO',
          namaNasabah: 'Demo User',
          tanggalLahir: new Date('1995-01-01'),
          namaIbuKandung: 'Ibu Demo',
          email: 'demo@finsight.com',
          password: hashedPassword,
          gajiBulanan: '15000000',
          segmenDemografi: 'Young Professional',
          personaDasar: 'Balanced Spender',
          isDynamic: true,
        });
        await queryRunner.manager.save(Nasabah, newDemoUser);

        // 3. Create active demo account
        this.logger.log('Creating active demo account (REK-DEMO)...');
        const demoAccount = queryRunner.manager.create(Rekening, {
          idRekening: 'REK-DEMO',
          idNasabah: 'USR-DEMO',
          saldo: '14094000', // Final balance after transactions
          status: 'Active',
        });
        await queryRunner.manager.save(Rekening, demoAccount);

        // 4. Seed demo transactions
        this.logger.log('Seeding demo transactions for REK-DEMO...');
        const now = new Date();

        const getPastDate = (daysAgo: number, hoursAgo: number) => {
          const d = new Date(now);
          d.setDate(d.getDate() - daysAgo);
          d.setHours(d.getHours() - hoursAgo);
          return d;
        };

        const createDateFields = (date: Date) => {
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

          const startOfWeek = new Date(date);
          const day = date.getDay();
          const diff = date.getDate() - day; // adjust to Sunday
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);

          const timeStr = date.toTimeString().slice(0, 8);

          return {
            timestamp: date,
            bulan: startOfMonth,
            hariBulan: today,
            hariMinggu: startOfWeek,
            jam: timeStr,
            menit: timeStr,
          };
        };

        const transactionsData = [
          {
            idTransaksi: 'TRX-00001',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Kredit',
            deskripsiMutasi: 'Gaji Bulanan PT FinSight',
            catatanMutasi: 'Income',
            idMcc: null,
            nominal: '15000000',
            sisaSaldo: '15000000',
            labelAnomali: false,
            kategoriBesar: 'Income',
            kategoriDetail: 'Pendapatan Bulanan',
            ...createDateFields(getPastDate(3, 5)),
          },
          {
            idTransaksi: 'TRX-00002',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Debit',
            deskripsiMutasi: 'Kopi Kenangan Dramaga',
            catatanMutasi: 'Makanan',
            idMcc: 'MCC-001',
            nominal: '45000',
            sisaSaldo: '14955000',
            labelAnomali: false,
            kategoriBesar: 'Wants',
            kategoriDetail: 'F&B dan Nongkrong',
            ...createDateFields(getPastDate(2, 4)),
          },
          {
            idTransaksi: 'TRX-00003',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Debit',
            deskripsiMutasi: 'Alfamart Dramaga 2',
            catatanMutasi: 'Belanja',
            idMcc: 'MCC-002',
            nominal: '150000',
            sisaSaldo: '14805000',
            labelAnomali: false,
            kategoriBesar: 'Wants',
            kategoriDetail: 'Belanja Online & Fashion',
            ...createDateFields(getPastDate(1, 6)),
          },
          {
            idTransaksi: 'TRX-00004',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Debit',
            deskripsiMutasi: 'Bensin Pertamina',
            catatanMutasi: 'Transportasi',
            idMcc: 'MCC-003',
            nominal: '100000',
            sisaSaldo: '14705000',
            labelAnomali: false,
            kategoriBesar: 'Needs',
            kategoriDetail: 'Transportasi',
            ...createDateFields(getPastDate(1, 2)),
          },
          {
            idTransaksi: 'TRX-00005',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Debit',
            deskripsiMutasi: 'Tagihan Listrik PLN',
            catatanMutasi: 'Tagihan',
            idMcc: 'MCC-004',
            nominal: '350000',
            sisaSaldo: '14355000',
            labelAnomali: false,
            kategoriBesar: 'Needs',
            kategoriDetail: 'Tagihan & Utilitas',
            ...createDateFields(getPastDate(0, 5)),
          },
          {
            idTransaksi: 'TRX-00006',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Debit',
            deskripsiMutasi: 'Netflix Subscription',
            catatanMutasi: 'Subscription',
            idMcc: 'MCC-004',
            nominal: '186000',
            sisaSaldo: '14169000',
            labelAnomali: false,
            kategoriBesar: 'Needs',
            kategoriDetail: 'Tagihan & Utilitas',
            ...createDateFields(getPastDate(0, 3)),
          },
          {
            idTransaksi: 'TRX-00007',
            idRekening: 'REK-DEMO',
            tipeMutasi: 'Debit',
            deskripsiMutasi: 'Warung Lesehan Dramaga',
            catatanMutasi: 'Makanan',
            idMcc: 'MCC-001',
            nominal: '75000',
            sisaSaldo: '14094000',
            labelAnomali: false,
            kategoriBesar: 'Wants',
            kategoriDetail: 'F&B dan Nongkrong',
            ...createDateFields(getPastDate(0, 1)),
          },
        ];

        const seededTxs = transactionsData.map((tx) => {
          return queryRunner.manager.create(Transaksi, tx);
        });

        await queryRunner.manager.save(Transaksi, seededTxs);
        this.logger.log('Database successfully seeded with demo user and transactions.');
      } else {
        this.logger.log('Demo user already exists. Skipping database seed.');
      }
    } catch (error) {
      this.logger.error('Failed to seed database:', error);
    } finally {
      await queryRunner.release();
    }
  }
}
