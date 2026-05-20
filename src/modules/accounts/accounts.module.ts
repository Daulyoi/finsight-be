import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Rekening } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rekening])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [TypeOrmModule],
})
export class AccountsModule {}
