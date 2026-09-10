import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { Property } from '../models/Property.js';
import { Host } from '../models/Host.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendPropertyStatusEmail } from '../services/emailService.js';

const router = Router();

// Secure all admin routes
router.use(requireAuth, requireRole('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [userCount, hostCount, propertyCount, bookingCount] = await Promise.all([
      User.countDocuments(),
      Host.countDocuments(),
      Property.countDocuments(),
      Booking.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        users: userCount,
        hosts: hostCount,
        properties: propertyCount,
        bookings: bookingCount,
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/properties', async (req, res, next) => {
  try {
    // Fetch properties pending review by default
    const status = req.query.status as string || 'PENDING_REVIEW';
    const properties = await Property.find({ verificationStatus: status })
      .populate('host')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { properties } });
  } catch (error) {
    next(error);
  }
});

router.put('/properties/:id/verify', async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z.object({
      status: z.enum(['VERIFIED', 'REJECTED']),
      reason: z.string().optional()
    }).parse(req.body);

    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    const session = await Property.startSession();
    await session.withTransaction(async () => {
      property.verificationStatus = input.status;
      if (input.status === 'VERIFIED') {
        property.isVerified = true;
        property.isPublished = true;
      } else {
        property.isVerified = false;
        property.isPublished = false;
      }
      await property.save({ session });

      await AuditLog.create([{
        actor: req.auth!.userId,
        action: input.status === 'VERIFIED' ? 'PROPERTY_VERIFIED' : 'PROPERTY_REJECTED',
        targetType: 'Property',
        targetId: property._id,
        metadata: { reason: input.reason }
      }], { session });
    });
    session.endSession();

    // Populate host user to send notification email
    const populatedProperty = await Property.findById(property._id).populate<{ host: { user: { name: string; email: string } } }>({
      path: 'host',
      populate: { path: 'user', select: 'name email' },
    });

    const hostUser = (populatedProperty?.host as any)?.user;
    if (hostUser?.email) {
      sendPropertyStatusEmail({
        hostName: hostUser.name || 'Host',
        hostEmail: hostUser.email,
        propertyTitle: property.title,
        status: input.status,
        rejectionReason: input.reason,
      }).catch((err) => console.error('[AdminRoute] Property status email error:', err));
    }

    res.json({ success: true, data: { property } });
  } catch (error) {
    next(error);
  }
});

export default router;
