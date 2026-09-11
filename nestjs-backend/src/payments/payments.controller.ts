import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('payu-init') // Keeping the old name from api.ts to not break frontend
  async initPayment(@Body() body: { bookingId: string }) {
    const data = await this.paymentsService.initPayment(body.bookingId);
    return { data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('payu-verify')
  async verifyPayment(@Body() body: { bookingId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const data = await this.paymentsService.verifyPayment(
      body.bookingId,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
    );
    return { data };
  }
}
