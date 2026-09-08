import { Router } from 'express';
import { Types } from 'mongoose';
import { Booking } from '../models/Booking.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const bookings = await Booking.find({ guest: req.auth?.userId })
      .populate('property', 'title city locality primaryImage address')
      .populate('room', 'name roomType')
      .sort({ checkIn: -1 })
      .lean();
    res.json({ success: true, data: { bookings } });
  } catch (error) { next(error); }
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!Types.ObjectId.isValid(bookingId)) { res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' } }); return; }
    const booking = await Booking.findOne({ _id: bookingId, guest: req.auth?.userId }).populate('property', 'title city locality primaryImage address').populate('room', 'name roomType').lean();
    if (!booking) { res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' } }); return; }
    res.json({ success: true, data: { booking } });
  } catch (error) { next(error); }
});

export default router;