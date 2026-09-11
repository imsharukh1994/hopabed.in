import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { UserVerification } from './entities/user-verification.entity';
import { PropertyVerificationDocument } from './entities/property-verification-document.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserVerification, PropertyVerificationDocument]), AuthModule],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}
