import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserVerification } from './entities/user-verification.entity';
import { PropertyVerificationDocument } from './entities/property-verification-document.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationService {
  private s3: S3Client;

  constructor(
    @InjectRepository(UserVerification) private userVerificationRepo: Repository<UserVerification>,
    @InjectRepository(PropertyVerificationDocument) private propertyDocRepo: Repository<PropertyVerificationDocument>,
    private configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('AWS_REGION') || 'ap-south-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || 'mockAccessKey',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || 'mockSecretKey',
      },
    });
  }

  async verifyOwnerIdentity(userId: string, idType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENCE', idNumber: string) {
    // Zero raw storage compliance: We do NOT store the raw idNumber.
    // In a real scenario, this calls a UIDAI/NSDL compliant e-KYC provider API.
    // We mock that API call here.
    const maskedId = '********' + idNumber.slice(-4);
    const providerReference = 'KYC_REF_' + Math.random().toString(36).substring(7).toUpperCase();

    const verification = this.userVerificationRepo.create({
      user: { id: userId } as User,
      idType,
      maskedId,
      providerReference,
      status: 'VERIFIED', // Mock auto-approval
      metadata: { verifiedAt: new Date().toISOString() },
    });

    return this.userVerificationRepo.save(verification);
  }

  async uploadPropertyDocument(propertyId: string, documentType: string, originalFilename: string, mimeType: string, fileBase64: string) {
    const bucket = this.configService.get('AWS_S3_BUCKET') || 'hopebed-docs';
    const s3Key = `properties/${propertyId}/${Date.now()}-${originalFilename}`;
    const buffer = Buffer.from(fileBase64, 'base64');

    if (process.env.NODE_ENV === 'production') {
      try {
        await this.s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: s3Key,
            Body: buffer,
            ContentType: mimeType,
            ServerSideEncryption: 'AES256', // Encrypted at rest
          })
        );
      } catch (err) {
        throw new BadRequestException('Failed to upload document to S3');
      }
    } else {
      console.log(`[DEV ONLY] Mock uploaded ${originalFilename} to S3 bucket ${bucket} with key ${s3Key}`);
    }

    const doc = this.propertyDocRepo.create({
      property: { id: propertyId } as Property,
      documentType,
      originalFilename,
      mimeType,
      s3Key,
    });

    return this.propertyDocRepo.save(doc);
  }
}
