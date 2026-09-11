import { Controller, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('owner/identity')
  async verifyIdentity(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { idType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENCE'; idNumber: string },
  ) {
    const data = await this.verificationService.verifyOwnerIdentity(req.user.userId, body.idType, body.idNumber);
    return { data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('property/:id/documents')
  async uploadPropertyDocument(
    @Param('id') propertyId: string,
    @Body() body: { documentType: string; originalFilename: string; mimeType: string; fileBase64: string },
  ) {
    const data = await this.verificationService.uploadPropertyDocument(
      propertyId,
      body.documentType,
      body.originalFilename,
      body.mimeType,
      body.fileBase64,
    );
    return { data };
  }
}
