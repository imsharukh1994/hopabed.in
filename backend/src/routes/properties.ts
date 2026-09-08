import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Booking } from '../models/Booking.js';
import { Property } from '../models/Property.js';
import { Room } from '../models/Room.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const dateSchema = z.object({
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.coerce.number().int().min(1).max(50).default(1),
});

function validateDates(checkIn: Date, checkOut: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);
  if (checkIn < today || checkOut <= checkIn) {
    throw new Error('DATES_INVALID');
  }
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function availableRooms(propertyIds: Types.ObjectId[], checkIn: Date, checkOut: Date, guests: number) {
  const rooms = await Room.find({ property: { $in: propertyIds }, isActive: true, capacity: { $gte: guests } }).lean();
  const roomIds = rooms.map((room) => room._id);
  const bookings = await Booking.find({
    room: { $in: roomIds },
    status: { $in: ['pending', 'confirmed', 'checked_in'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  }).lean();
  const booked = new Map<string, number>();
  for (const booking of bookings) booked.set(String(booking.room), (booked.get(String(booking.room)) ?? 0) + booking.roomCount);
  return rooms.filter((room) => (booked.get(String(room._id)) ?? 0) < room.inventory);
}

router.get('/search', async (req, res, next) => {
  try {
    const query = z.object({
      destination: z.string().trim().max(100).optional(),
      propertyType: z.string().trim().optional(),
      minPrice: z.coerce.number().nonnegative().optional(),
      maxPrice: z.coerce.number().nonnegative().optional(),
      ...dateSchema.shape,
    }).parse(req.query);
    const nights = validateDates(query.checkIn, query.checkOut);
    const propertyFilter: Record<string, unknown> = {
      verificationStatus: 'VERIFIED',
      isVerified: true,
      isPublished: true,
    };
    if (query.destination) {
      propertyFilter.$or = [
        { city: new RegExp(escapeRegex(query.destination), 'i') },
        { locality: new RegExp(escapeRegex(query.destination), 'i') },
        { title: new RegExp(escapeRegex(query.destination), 'i') },
      ];
    }
    if (query.propertyType) propertyFilter.propertyType = query.propertyType;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      propertyFilter.pricePerNight = { ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}) };
    }
    const properties = await Property.find(propertyFilter).sort({ isFeatured: -1, createdAt: -1 }).limit(50).lean();
    const rooms = await availableRooms(properties.map((property) => property._id), query.checkIn, query.checkOut, query.guests);
    const availablePropertyIds = new Set(rooms.map((room) => String(room.property)));
    res.json({ success: true, data: { nights, properties: properties.filter((property) => availablePropertyIds.has(String(property._id))) } });
  } catch (error) {
    if (error instanceof Error && error.message === 'DATES_INVALID') {
      res.status(400).json({ success: false, error: { code: 'DATES_INVALID', message: 'Choose a future check-in and a later check-out date.' } });
      return;
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
      return;
    }
    const property = await Property.findOne({ _id: req.params.id, verificationStatus: 'VERIFIED', isVerified: true, isPublished: true }).lean();
    if (!property) {
      res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
      return;
    }
    const rooms = await Room.find({ property: property._id, isActive: true }).lean();
    res.json({ success: true, data: { property, rooms } });
  } catch (error) { next(error); }
});

router.post('/:id/bookings', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  const session = await Booking.startSession();
  try {
    const propertyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!Types.ObjectId.isValid(propertyId)) {
      res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
      return;
    }
    const input = z.object({ roomId: z.string().refine(Types.ObjectId.isValid), checkIn: z.coerce.date(), checkOut: z.coerce.date(), guests: z.coerce.number().int().min(1), roomCount: z.coerce.number().int().min(1).max(20).default(1), notes: z.string().trim().max(500).optional() }).parse(req.body);
    const nights = validateDates(input.checkIn, input.checkOut);
    const auth = req.auth;
    if (!auth) throw new Error('UNAUTHORIZED');
    let booking;
    await session.withTransaction(async () => {
      const property = await Property.findOne({ _id: propertyId, verificationStatus: 'VERIFIED', isVerified: true, isPublished: true }).session(session);
      const room = await Room.findOne({ _id: input.roomId, property: propertyId, isActive: true }).session(session);
      if (!property || !room || input.guests > room.capacity) throw new Error('ROOM_UNAVAILABLE');
      const overlap = await Booking.aggregate([{ $match: { room: room._id, status: { $in: ['pending', 'confirmed', 'checked_in'] }, checkIn: { $lt: input.checkOut }, checkOut: { $gt: input.checkIn } } }]).session(session);
      const bookedCount = overlap.reduce((total, item) => total + (item.roomCount ?? 1), 0);
      if (bookedCount + input.roomCount > room.inventory) throw new Error('ROOM_UNAVAILABLE');
      const subtotal = room.pricePerNight * nights * input.roomCount;
      const serviceFee = Math.round(subtotal * 0.05);
      const taxes = Math.round((subtotal + serviceFee) * 0.05);
      [booking] = await Booking.create([{ property: property._id, guest: auth.userId, host: property.host, room: room._id, checkIn: input.checkIn, checkOut: input.checkOut, nights, guests: input.guests, roomCount: input.roomCount, pricePerNight: room.pricePerNight, subtotal, serviceFee, taxes, totalAmount: subtotal + serviceFee + taxes, currency: room.currency, notes: input.notes, status: 'pending', paymentStatus: 'UNPAID' }], { session });
    });
    res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'ROOM_UNAVAILABLE') { res.status(409).json({ success: false, error: { code, message: 'Sorry, this room is no longer available for the selected dates.' } }); return; }
    if (code === 'DATES_INVALID') { res.status(400).json({ success: false, error: { code, message: 'Choose valid future dates.' } }); return; }
    next(error);
  } finally { await session.endSession(); }
});

export default router;