import { Controller, Post, Get, Body, Req, UseGuards, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('api')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('properties/:propertyId/bookings')
  async createBooking(
    @Req() req: Request & { user: { userId: string } },
    @Param('propertyId') propertyId: string,
    @Body() body: any,
  ) {
    const booking = await this.bookingsService.createBooking(req.user.userId, propertyId, body);
    return { data: { booking } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  async getBookings(@Req() req: Request & { user: { userId: string } }) {
    const bookings = await this.bookingsService.getGuestBookings(req.user.userId);
    return { data: { bookings } };
  }
}
