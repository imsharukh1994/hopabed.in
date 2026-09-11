import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Property } from '../properties/entities/property.entity';
import { Room } from '../properties/entities/room.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Property, Room]), AuthModule],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
