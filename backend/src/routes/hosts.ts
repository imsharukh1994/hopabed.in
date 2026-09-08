import { Router } from 'express';
import { z } from 'zod';
import { Host } from '../models/Host.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { Property } from '../models/Property.js';
import { Room } from '../models/Room.js';
import { Booking } from '../models/Booking.js';

const router = Router();

const hostRegistrationSchema = z.object({
  businessName: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
});

router.post('/register', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const existingHost = await Host.findOne({ user: userId });
    if (existingHost) {
      res.status(409).json({ success: false, error: { code: 'ALREADY_HOST', message: 'You are already registered as a host.' } });
      return;
    }

    const input = hostRegistrationSchema.parse(req.body);

    const session = await Host.startSession();
    let host;
    
    await session.withTransaction(async () => {
      [host] = await Host.create(
        [{ user: userId, businessName: input.businessName, bio: input.bio, verificationStatus: 'pending', kycStatus: 'not_started' }],
        { session }
      );
      await User.findByIdAndUpdate(userId, { role: 'host' }, { session });
    });

    session.endSession();

    res.status(201).json({ success: true, data: { host } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const host = await Host.findOne({ user: req.auth?.userId });
    if (!host) {
      res.status(404).json({ success: false, error: { code: 'NOT_A_HOST', message: 'You are not registered as a host.' } });
      return;
    }
    res.json({ success: true, data: { host } });
  } catch (error) {
    next(error);
  }
});

router.get('/properties', requireAuth, requireRole('host', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const host = await Host.findOne({ user: req.auth?.userId });
    if (!host) {
      res.status(404).json({ success: false, error: { code: 'NOT_A_HOST', message: 'Host profile not found.' } });
      return;
    }
    const properties = await Property.find({ host: host._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { properties } });
  } catch (error) {
    next(error);
  }
});

router.post('/properties', requireAuth, requireRole('host', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const host = await Host.findOne({ user: req.auth?.userId });
    if (!host) {
      res.status(404).json({ success: false, error: { code: 'NOT_A_HOST', message: 'Host profile not found.' } });
      return;
    }
    
    // Very basic schema for MVP. Ideally full zod validation here.
    const propertyData = req.body;
    
    // Generate a basic slug
    const slug = propertyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    
    const property = await Property.create({
      ...propertyData,
      host: host._id,
      slug,
      verificationStatus: 'DRAFT'
    });
    
    await Host.findByIdAndUpdate(host._id, { $inc: { propertyCount: 1 } });
    
    res.status(201).json({ success: true, data: { property } });
  } catch (error) {
    next(error);
  }
});

router.post('/properties/:propertyId/rooms', requireAuth, requireRole('host', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const host = await Host.findOne({ user: req.auth?.userId });
    if (!host) {
      res.status(404).json({ success: false, error: { code: 'NOT_A_HOST', message: 'Host profile not found.' } });
      return;
    }

    const property = await Property.findOne({ _id: req.params.propertyId, host: host._id });
    if (!property) {
      res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
      return;
    }
    
    const room = await Room.create({
      ...req.body,
      property: property._id
    });
    
    res.status(201).json({ success: true, data: { room } });
  } catch (error) {
    next(error);
  }
});

router.get('/bookings', requireAuth, requireRole('host', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const host = await Host.findOne({ user: req.auth?.userId });
    if (!host) {
      res.status(404).json({ success: false, error: { code: 'NOT_A_HOST', message: 'Host profile not found.' } });
      return;
    }

    const bookings = await Booking.find({ host: host._id })
      .populate('property', 'title city locality')
      .populate('room', 'name')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-pass', requireAuth, requireRole('host', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z.object({ bookingId: z.string() }).parse(req.body);

    const host = await Host.findOne({ user: req.auth?.userId });
    if (!host) {
      res.status(404).json({ success: false, error: { code: 'NOT_A_HOST', message: 'Host profile not found.' } });
      return;
    }

    const booking = await Booking.findOne({ _id: input.bookingId, host: host._id }).populate('guest', 'name email');
    if (!booking) {
      res.status(404).json({ success: false, error: { message: 'Invalid Stay Pass. Booking not found for your properties.' } });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ success: false, error: { message: 'Booking was cancelled.' } });
      return;
    }
    if (booking.status === 'checked_in') {
      res.status(400).json({ success: false, error: { message: 'Guest is already checked in.' } });
      return;
    }
    if (booking.paymentStatus !== 'PAID') {
      res.status(400).json({ success: false, error: { message: 'Booking is unpaid.' } });
      return;
    }

    booking.status = 'checked_in';
    await booking.save();

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
});

export default router;
