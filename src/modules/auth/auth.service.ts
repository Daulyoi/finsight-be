import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Rekening } from '../accounts/entities/account.entity';
import { Nasabah } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Rekening)
    private readonly rekeningRepository: Repository<Rekening>,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingByEmail = await this.usersService.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check if idNasabah already exists
    const existingById = await this.usersService.findById(dto.idNasabah);
    if (existingById) {
      throw new ConflictException('Customer ID is already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const newUser = await this.usersService.createNasabah({
      idNasabah: dto.idNasabah,
      namaNasabah: dto.namaNasabah,
      tanggalLahir: new Date(dto.tanggalLahir),
      namaIbuKandung: dto.namaIbuKandung,
      email: dto.email,
      password: hashedPassword,
      gajiBulanan: dto.gajiBulanan ? String(dto.gajiBulanan) : null,
      isDynamic: true,
      segmenDemografi: null,
      personaDasar: null,
    });

    // Automatically create a default active rekening for the user
    const randomAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const defaultRekening = this.rekeningRepository.create({
      idRekening: `REK-${randomAccountNumber}`,
      idNasabah: newUser.idNasabah,
      saldo: '0',
      status: 'Active',
    });
    await this.rekeningRepository.save(defaultRekening);

    // Generate tokens
    const tokens = await this.getTokens(newUser.idNasabah, newUser.email);
    await this.updateRefreshToken(newUser.idNasabah, tokens.refreshToken);

    const { password, currentHashedRefreshToken, ...userWithoutSecrets } = newUser;

    return {
      user: userWithoutSecrets,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.getTokens(user.idNasabah, user.email);
    await this.updateRefreshToken(user.idNasabah, tokens.refreshToken);

    const { password, currentHashedRefreshToken, ...userWithoutSecrets } = user;

    return {
      user: userWithoutSecrets,
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.currentHashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.getTokens(user.idNasabah, user.email);
    await this.updateRefreshToken(user.idNasabah, tokens.refreshToken);

    return tokens;
  }

  // --- Helper Methods ---

  private async updateRefreshToken(userId: string, refreshToken: string | null) {
    if (refreshToken) {
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
    } else {
      await this.usersService.updateRefreshToken(userId, null);
    }
  }

  private async getTokens(userId: string, email: string) {
    const jwtPayload = {
      sub: userId,
      email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET', 'gilayalusecretkeykykbeginit6'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET', 'gilayalusecretkeykykbeginit6'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
