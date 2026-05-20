import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaksi } from './entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaksi])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
