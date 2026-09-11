import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(OtpVerification) private otpRepository: Repository<OtpVerification>,
    private jwtService: JwtService,
  ) {}

  async sendOtp(identifier: string, identifierType: 'mobile' | 'email') {
    // In MVP, we only do mobile OTP via MSG91
    if (identifierType !== 'mobile') {
      throw new BadRequestException('Only mobile verification is supported right now');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const record = this.otpRepository.create({
      identifier,
      otp,
      expiresAt,
    });
    await this.otpRepository.save(record);

    // Call MSG91 API
    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
    
    if (MSG91_AUTH_KEY && MSG91_TEMPLATE_ID && process.env.NODE_ENV === 'production') {
      try {
        await axios.post('https://control.msg91.com/api/v5/otp', {
          template_id: MSG91_TEMPLATE_ID,
          mobile: identifier,
          authkey: MSG91_AUTH_KEY,
          otp: otp
        });
      } catch (error) {
        console.error('Failed to send MSG91 OTP', error);
      }
    } else {
      console.log(`[DEV ONLY] OTP for ${identifier} is ${otp}`);
    }

    return { message: 'OTP sent successfully', resendCooldownSeconds: 30 };
  }

  async verifyOtp(identifier: string, identifierType: 'mobile' | 'email', otp: string) {
    const record = await this.otpRepository.findOne({
      where: {
        identifier,
        otp,
        expiresAt: MoreThan(new Date()),
        isVerified: false,
      },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    record.isVerified = true;
    await this.otpRepository.save(record);

    let user = await this.usersRepository.findOne({ where: { phone: identifier } });
    if (!user) {
      user = this.usersRepository.create({ phone: identifier });
      await this.usersRepository.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { data: { token, user } };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { data: { user } };
  }
}
