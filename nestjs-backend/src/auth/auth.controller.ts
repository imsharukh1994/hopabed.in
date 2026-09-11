import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  async sendOtp(@Body() body: { identifierType: 'mobile' | 'email'; identifier: string }) {
    const data = await this.authService.sendOtp(body.identifier, body.identifierType);
    return { data };
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: { identifierType: 'mobile' | 'email'; identifier: string; otp: string }) {
    return this.authService.verifyOtp(body.identifier, body.identifierType, body.otp);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    return this.authService.getCurrentUser(req.user.userId);
  }
}
