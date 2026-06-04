import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaksi } from './entities/transaction.entity';
import { Rekening } from '../accounts/entities/account.entity';
import { UsersService } from '../users/users.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaksi)
    private readonly transaksiRepository: Repository<Transaksi>,
    @InjectRepository(Rekening)
    private readonly rekeningRepository: Repository<Rekening>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    // Resolve account
    let rekeningId = dto.idRekening;
    let rekening: Rekening | null = null;

    if (!rekeningId || rekeningId === 'REK-DEFAULT') {
      const userAccounts = await this.rekeningRepository.find({
        where: { idNasabah: userId },
      });
      if (userAccounts.length === 0) {
        throw new NotFoundException('No active account found for user');
      }
      rekening = userAccounts[0];
    } else {
      rekening = await this.rekeningRepository.findOne({
        where: { idRekening: rekeningId, idNasabah: userId },
      });
      if (!rekening) {
        throw new NotFoundException(`Account with ID ${rekeningId} not found for this user`);
      }
    }

    const currentSaldo = BigInt(rekening.saldo);
    const nominalBig = BigInt(Math.round(dto.nominal));
    let newSaldo = currentSaldo;

    if (dto.tipeMutasi === 'Debit') {
      if (currentSaldo < nominalBig) {
        throw new BadRequestException('Insufficient balance');
      }
      newSaldo -= nominalBig;
    } else if (dto.tipeMutasi === 'Kredit') {
      newSaldo += nominalBig;
    } else {
      throw new BadRequestException('Invalid mutation type (must be Debit or Kredit)');
    }

    // Save updated balance
    rekening.saldo = newSaldo.toString();
    await this.rekeningRepository.save(rekening);

    // Prepare date fields
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day; // adjust to Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const timeStr = now.toTimeString().slice(0, 8); // e.g. "08:42:00"

    // Categorization Logic matching the requirements
    const categorization = this.categorizeTransaction(dto);

    // Generate transaction ID
    const randomId = Math.floor(10000 + Math.random() * 90000).toString();
    const transactionId = `TRX-${randomId}`;

    const newTx = this.transaksiRepository.create({
      idTransaksi: transactionId,
      idRekening: rekening.idRekening,
      timestamp: now,
      tipeMutasi: dto.tipeMutasi,
      deskripsiMutasi: dto.deskripsiMutasi || null,
      catatanMutasi: dto.catatanMutasi || null,
      idMcc: dto.idMcc || null,
      nominal: nominalBig.toString(),
      sisaSaldo: rekening.saldo,
      labelAnomali: false,
      bulan: startOfMonth,
      hariBulan: today,
      hariMinggu: startOfWeek,
      jam: timeStr,
      menit: timeStr,
      kategoriBesar: categorization.kategoriBesar,
      kategoriDetail: categorization.kategoriDetail,
    });

    const savedTx = await this.transaksiRepository.save(newTx);

    // Fetch updated financial ratios
    const ratios = await this.usersService.getFinancialRatios(userId);

    return {
      transaction: savedTx,
      updatedRatios: ratios,
    };
  }

  async findAll(userId: string): Promise<Transaksi[]> {
    return this.transaksiRepository.find({
      where: {
        rekening: {
          idNasabah: userId,
        },
      },
      relations: ['rekening'],
      order: {
        timestamp: 'DESC',
      },
    });
  }

  async findOne(userId: string, transactionId: string): Promise<Transaksi> {
    const tx = await this.transaksiRepository.findOne({
      where: {
        idTransaksi: transactionId,
        rekening: {
          idNasabah: userId,
        },
      },
      relations: ['rekening'],
    });

    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    return tx;
  }

  async update(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    const tx = await this.findOne(userId, transactionId);
    
    if (dto.deskripsiMutasi !== undefined) tx.deskripsiMutasi = dto.deskripsiMutasi;
    if (dto.catatanMutasi !== undefined) tx.catatanMutasi = dto.catatanMutasi;
    
    return this.transaksiRepository.save(tx);
  }

  async remove(userId: string, transactionId: string) {
    const tx = await this.findOne(userId, transactionId);
    await this.transaksiRepository.remove(tx);
    return { message: 'Transaction removed successfully' };
  }

  private categorizeTransaction(dto: CreateTransactionDto): { kategoriBesar: string; kategoriDetail: string } {
    const catatan = (dto.catatanMutasi || '').toLowerCase();
    const desc = (dto.deskripsiMutasi || '').toLowerCase();
    const type = dto.tipeMutasi;

    if (type === 'Kredit') {
      return {
        kategoriBesar: 'Income',
        kategoriDetail: 'Pendapatan Bulanan',
      };
    }

    // Debit
    if (
      catatan.includes('makan') || 
      catatan.includes('food') || 
      catatan.includes('kopi') || 
      desc.includes('kopi') || 
      desc.includes('makan') || 
      desc.includes('lesehan') || 
      desc.includes('warung')
    ) {
      return {
        kategoriBesar: 'Wants',
        kategoriDetail: 'F&B dan Nongkrong',
      };
    }
    if (
      catatan.includes('belanja') || 
      catatan.includes('shop') || 
      desc.includes('alfamart') || 
      desc.includes('informa') || 
      desc.includes('belanja') || 
      desc.includes('gaya hidup') || 
      desc.includes('uniqlo')
    ) {
      return {
        kategoriBesar: 'Wants',
        kategoriDetail: 'Belanja Online & Fashion',
      };
    }
    if (
      catatan.includes('transp') || 
      catatan.includes('gojek') || 
      catatan.includes('grab') || 
      catatan.includes('bensin') || 
      desc.includes('transport') || 
      desc.includes('bensin')
    ) {
      return {
        kategoriBesar: 'Needs',
        kategoriDetail: 'Transportasi',
      };
    }
    if (
      catatan.includes('tagihan') || 
      catatan.includes('bill') || 
      catatan.includes('sub') || 
      desc.includes('tagihan') || 
      desc.includes('icloud') || 
      desc.includes('bpjs') || 
      desc.includes('netflix') || 
      desc.includes('spotify') || 
      desc.includes('subscription')
    ) {
      return {
        kategoriBesar: 'Needs',
        kategoriDetail: 'Tagihan & Utilitas',
      };
    }

    return {
      kategoriBesar: 'Wants',
      kategoriDetail: 'Transfer P2P',
    };
  }
}
