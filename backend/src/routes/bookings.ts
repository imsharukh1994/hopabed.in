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

router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' } });
      return;
    }

    const booking = await Booking.findOne({ _id: bookingId, guest: req.auth?.userId })
      .populate<{ guest: { name: string; email: string } }>('guest', 'name email')
      .populate<{ property: { title: string } }>('property', 'title')
      .populate<{ host: { user: { name: string; email: string } } }>({
        path: 'host',
        populate: { path: 'user', select: 'name email' },
      });

    if (!booking) {
      res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' } });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ success: false, error: { code: 'ALREADY_CANCELLED', message: 'Booking is already cancelled.' } });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    const guestName = booking.guest?.name || 'Guest';
    const guestEmail = booking.guest?.email;
    const propertyTitle = booking.property?.title || 'Property';

    if (guestEmail) {
      const { sendCancellationEmail } = await import('../services/emailService.js');
      sendCancellationEmail({
        recipientName: guestName,
        recipientEmail: guestEmail,
        bookingId: String(booking._id),
        propertyTitle,
        cancelledBy: 'Guest',
      }).catch((err) => console.error('[BookingRoute] Cancellation email error:', err));
    }

    const hostUser = (booking.host as any)?.user;
    if (hostUser?.email) {
      const { sendCancellationEmail } = await import('../services/emailService.js');
      sendCancellationEmail({
        recipientName: hostUser.name || 'Host',
        recipientEmail: hostUser.email,
        bookingId: String(booking._id),
        propertyTitle,
        cancelledBy: 'Guest',
      }).catch((err) => console.error('[BookingRoute] Host cancellation email error:', err));
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
});

export default router;