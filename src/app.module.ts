import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PersonaHistoryModule } from './modules/persona_history/persona_history.module';
import { MccMapModule } from './modules/mcc_map/mcc_map.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = Number(configService.get<string>('DB_PORT', '5432'));

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number.isNaN(port) ? 5432 : port,
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'finsight_db'),
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    UsersModule,
    TransactionsModule,
    AccountsModule,
    PersonaHistoryModule,
    MccMapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
