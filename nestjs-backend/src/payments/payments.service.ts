import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ConfigService } from '@nestjs/config';
import * as Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private configService: ConfigService,
  ) {
    this.razorpay = new (Razorpay as any)({
      key_id: this.configService.get('RAZORPAY_KEY_ID') || 'mockKeyId',
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET') || 'mockSecret',
    });
  }

  async initPayment(bookingId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new BadRequestException('Booking not found');

    let orderId = `mock_order_${Date.now()}`;

    if (process.env.NODE_ENV === 'production') {
      try {
        const order = await this.razorpay.orders.create({
          amount: booking.totalAmount * 100, // in paise
          currency: booking.currency,
          receipt: booking.id,
        });
        orderId = order.id;
      } catch (err) {
        throw new BadRequestException('Failed to initialize Razorpay order');
      }
    }

    const payment = this.paymentRepo.create({
      booking: { id: booking.id } as Booking,
      amount: booking.totalAmount,
      currency: booking.currency,
      gatewayOrderId: orderId,
    });
    await this.paymentRepo.save(payment);

    return {
      orderId,
      amount: booking.totalAmount,
      currency: booking.currency,
      key: this.configService.get('RAZORPAY_KEY_ID'),
    };
  }

  async verifyPayment(bookingId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    const payment = await this.paymentRepo.findOne({ where: { gatewayOrderId: razorpayOrderId } });
    if (!booking || !payment) throw new BadRequestException('Invalid payment details');

    if (process.env.NODE_ENV === 'production') {
      const hmac = crypto.createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET') || '');
      hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        payment.status = 'FAILED';
        await this.paymentRepo.save(payment);
        throw new BadRequestException('Payment verification failed');
      }
    }

    payment.status = 'SUCCESS';
    payment.gatewayPaymentId = razorpayPaymentId;
    payment.gatewaySignature = razorpaySignature;
    await this.paymentRepo.save(payment);

    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'PAID';
    await this.bookingRepo.save(booking);

    return { status: 'SUCCESS' };
  }
}
