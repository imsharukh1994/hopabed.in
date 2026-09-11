import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Property } from '../properties/entities/property.entity';
import { Room } from '../properties/entities/room.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
  ) {}

  async createBooking(userId: string, propertyId: string, input: any) {
    const { roomId, checkIn: checkInStr, checkOut: checkOutStr, guests, roomCount = 1, notes } = input;
    
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today || checkOut <= checkIn) {
      throw new BadRequestException('Choose a future check-in and a later check-out date.');
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);

    // Using query builder or simple locks is needed for true concurrency, but for MVP:
    const property = await this.propertyRepo.findOne({ where: { id: propertyId, isVerified: true, isPublished: true }, relations: ['host'] });
    const room = await this.roomRepo.findOne({ where: { id: roomId, property: { id: propertyId }, isActive: true } });

    if (!property || !room || guests > room.capacity) {
      throw new ConflictException('Room unavailable or capacity exceeded.');
    }

    // Overlap check
    const overlaps = await this.bookingRepo.find({
      where: {
        room: { id: roomId },
        status: In(['PENDING', 'CONFIRMED', 'CHECKED_IN']),
        checkIn: LessThan(checkOut),
        checkOut: MoreThan(checkIn),
      },
    });

    const bookedCount = overlaps.reduce((sum, b) => sum + (b.roomCount || 1), 0);
    if (bookedCount + roomCount > room.inventory) {
      throw new ConflictException('Sorry, this room is no longer available for the selected dates.');
    }

    const subtotal = room.pricePerNight * nights * roomCount;
    const serviceFee = Math.round(subtotal * 0.05);
    const taxes = Math.round((subtotal + serviceFee) * 0.05);
    const totalAmount = subtotal + serviceFee + taxes;

    const booking = this.bookingRepo.create({
      property,
      room,
      guest: { id: userId },
      host: property.host,
      checkIn,
      checkOut,
      nights,
      guests,
      roomCount,
      subtotal,
      serviceFee,
      taxes,
      totalAmount,
      currency: room.currency,
      notes,
    });

    return this.bookingRepo.save(booking);
  }

  async getGuestBookings(userId: string) {
    return this.bookingRepo.find({
      where: { guest: { id: userId } },
      relations: ['property', 'room'],
      order: { createdAt: 'DESC' },
    });
  }
}
