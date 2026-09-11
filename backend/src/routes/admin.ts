import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { Property } from '../models/Property.js';
import { Host } from '../models/Host.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Room } from '../models/Room.js';
import { AuditLog } from '../models/AuditLog.js';
import { OwnerVerification } from '../models/OwnerVerification.js';
import { PropertyVerification } from '../models/PropertyVerification.js';
import { PropertyVerificationDocument } from '../models/PropertyVerificationDocument.js';
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
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/verification/queue
 * Fetch detailed verification review queue items
 */
router.get('/verification/queue', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'PENDING_REVIEW';
    const filter: Record<string, unknown> = {};
    if (status !== 'ALL') {
      filter.verificationStatus = status;
    }

    const properties = await Property.find(filter)
      .populate({
        path: 'host',
        populate: { path: 'user', select: 'name email phone avatarUrl' },
      })
      .sort({ createdAt: -1 });

    const queueItems = await Promise.all(
      properties.map(async (prop) => {
        const hostObj = prop.host as any;
        const hostId = hostObj?._id;

        const [ownerVerif, propVerif, documents, rooms] = await Promise.all([
          hostId ? OwnerVerification.findOne({ host: hostId }) : null,
          PropertyVerification.findOne({ property: prop._id }),
          PropertyVerificationDocument.find({ property: prop._id }),
          Room.find({ property: prop._id }),
        ]);

        return {
          property: prop,
          host: hostObj,
          ownerVerification: ownerVerif
            ? {
                governmentIdType: ownerVerif.governmentIdType,
                governmentIdStatus: ownerVerif.governmentIdStatus,
                panStatus: ownerVerif.panStatus,
                panNumberMasked: ownerVerif.panNumberMasked,
                panName: ownerVerif.panName,
                verificationStatus: ownerVerif.verificationStatus,
              }
            : null,
          propertyVerification: propVerif,
          documents,
          rooms,
        };
      })
    );

    res.json({ success: true, data: { queue: queueItems } });
  } catch (error) {
    next(error);
  }
});

router.get('/properties', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'PENDING_REVIEW';
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
    const input = z
      .object({
        status: z.enum(['VERIFIED', 'CHANGES_REQUESTED', 'REJECTED']),
        reason: z.string().optional(),
      })
      .parse(req.body);

    if (input.status === 'CHANGES_REQUESTED' && (!input.reason || input.reason.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: { code: 'REASON_REQUIRED', message: 'Please provide a clear reason when requesting changes.' },
      });
      return;
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    const session = await Property.startSession();
    await session.withTransaction(async () => {
      property.verificationStatus = input.status;
      property.rejectionReason = input.reason;

      if (input.status === 'VERIFIED') {
        property.isVerified = true;
        property.isPublished = true; // Meets server-side guard: owner verified + property verified + admin approved
      } else {
        property.isVerified = false;
        property.isPublished = false;
      }
      await property.save({ session });

      // Update PropertyVerification model status
      let propVerif = await PropertyVerification.findOne({ property: property._id }).session(session);
      if (!propVerif) {
        propVerif = new PropertyVerification({
          property: property._id,
          host: property.host,
          isOwner: !property.isOperator,
          operatorRole: property.operatorRole || 'owner',
        });
      }
      propVerif.status =
        input.status === 'VERIFIED'
          ? 'verified'
          : input.status === 'CHANGES_REQUESTED'
          ? 'changes_requested'
          : 'rejected';
      propVerif.rejectionReason = input.reason;
      propVerif.reviewedBy = new Types.ObjectId(req.auth!.userId);
      if (input.status === 'VERIFIED') {
        propVerif.verifiedAt = new Date();
      }
      await propVerif.save({ session });

      await AuditLog.create(
        [
          {
            actor: req.auth!.userId,
            action:
              input.status === 'VERIFIED'
                ? 'PROPERTY_VERIFIED'
                : input.status === 'CHANGES_REQUESTED'
                ? 'PROPERTY_CHANGES_REQUESTED'
                : 'PROPERTY_REJECTED',
            targetType: 'Property',
            targetId: property._id,
            metadata: { reason: input.reason },
          },
        ],
        { session }
      );
    });
    session.endSession();

    // Send email notification to host
    const populatedProperty = await Property.findById(property._id).populate<{
      host: { user: { name: string; email: string } };
    }>({
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
