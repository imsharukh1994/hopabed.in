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
import { sendPropertyStatusEmail, sendHostVerificationStatusEmail } from '../services/emailService.js';

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
 * GET /api/admin/audit-logs
 * Fetch recent verification audit trail logs
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: { logs } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/verifications/hosts
 * Get host verification queue
 */
router.get('/verifications/hosts', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const filter: Record<string, unknown> = {};
    if (status !== 'ALL') {
      filter.verificationStatus = status;
    }

    const hosts = await Host.find(filter)
      .populate('user', 'name email phone avatarUrl')
      .sort({ updatedAt: -1 });

    const queueItems = await Promise.all(
      hosts.map(async (h) => {
        const ownerVerif = await OwnerVerification.findOne({ host: h._id });
        const propertiesCount = await Property.countDocuments({ host: h._id });
        return {
          host: h,
          user: h.user,
          ownerVerification: ownerVerif,
          propertiesCount,
        };
      })
    );

    res.json({ success: true, data: { hosts: queueItems } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/verifications/hosts/:id
 * Get single host verification details
 */
router.get('/verifications/hosts/:id', async (req, res, next) => {
  try {
    const host = await Host.findById(req.params.id).populate('user', 'name email phone avatarUrl');
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const [ownerVerif, properties] = await Promise.all([
      OwnerVerification.findOne({ host: host._id }),
      Property.find({ host: host._id }),
    ]);

    res.json({
      success: true,
      data: {
        host,
        user: host.user,
        ownerVerification: ownerVerif,
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/verifications/hosts/:id/approve
 * Approve host identity verification
 */
router.post('/verifications/hosts/:id/approve', async (req: AuthenticatedRequest, res, next) => {
  try {
    const hostId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const host = await Host.findById(hostId).populate<{ user: { name: string; email: string } }>('user', 'name email');
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const input = z.object({ notes: z.string().optional() }).parse(req.body || {});
    const now = new Date();
    const adminId = new Types.ObjectId(req.auth!.userId);

    host.verificationStatus = 'verified';
    host.kycStatus = 'verified';
    host.reviewedAt = now;
    host.reviewedBy = adminId;
    host.rejectionReason = undefined;
    if (input.notes) host.verificationNotes = input.notes;
    await host.save();

    let ownerVerif = await OwnerVerification.findOne({ host: host._id });
    if (ownerVerif) {
      ownerVerif.verificationStatus = 'verified';
      ownerVerif.governmentIdStatus = 'verified';
      ownerVerif.panStatus = 'verified';
      ownerVerif.verifiedAt = now;
      ownerVerif.reviewedAt = now;
      ownerVerif.reviewedBy = adminId;
      ownerVerif.rejectionReason = undefined;
      await ownerVerif.save();
    }

    await AuditLog.create({
      actor: adminId,
      action: 'HOST_VERIFIED',
      targetType: 'Host',
      targetId: host._id,
      metadata: { notes: input.notes },
    });

    const userObj = (host.user as any);
    if (userObj?.email) {
      sendHostVerificationStatusEmail({
        hostName: userObj.name || 'Host',
        hostEmail: userObj.email,
        status: 'verified',
      }).catch((err: unknown) => console.error('[AdminRoute] Host verification status email error:', err));
    }

    res.json({
      success: true,
      data: {
        message: 'Host verification approved successfully.',
        host,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/verifications/hosts/:id/reject
 * Reject host identity verification with reason
 */
router.post('/verifications/hosts/:id/reject', async (req: AuthenticatedRequest, res, next) => {
  try {
    const hostId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const input = z.object({ reason: z.string().min(2, 'Rejection reason is required.') }).parse(req.body);

    const host = await Host.findById(hostId).populate<{ user: { name: string; email: string } }>('user', 'name email');
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const now = new Date();
    const adminId = new Types.ObjectId(req.auth!.userId);

    host.verificationStatus = 'rejected';
    host.kycStatus = 'rejected';
    host.reviewedAt = now;
    host.reviewedBy = adminId;
    host.rejectionReason = input.reason;
    await host.save();

    let ownerVerif = await OwnerVerification.findOne({ host: host._id });
    if (ownerVerif) {
      ownerVerif.verificationStatus = 'rejected';
      ownerVerif.reviewedAt = now;
      ownerVerif.reviewedBy = adminId;
      ownerVerif.rejectionReason = input.reason;
      await ownerVerif.save();
    }

    await AuditLog.create({
      actor: adminId,
      action: 'HOST_REJECTED',
      targetType: 'Host',
      targetId: host._id,
      metadata: { reason: input.reason },
    });

    const userObj = (host.user as any);
    if (userObj?.email) {
      sendHostVerificationStatusEmail({
        hostName: userObj.name || 'Host',
        hostEmail: userObj.email,
        status: 'rejected',
        rejectionReason: input.reason,
      }).catch((err: unknown) => console.error('[AdminRoute] Host verification status email error:', err));
    }

    res.json({
      success: true,
      data: {
        message: 'Host verification rejected.',
        host,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/verifications/hosts/:id/suspend
 * Suspend host account and unpublish all their properties
 */
router.post('/verifications/hosts/:id/suspend', async (req: AuthenticatedRequest, res, next) => {
  try {
    const hostId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const input = z.object({ reason: z.string().min(2, 'Suspension reason is required.') }).parse(req.body);

    const host = await Host.findById(hostId).populate<{ user: { name: string; email: string } }>('user', 'name email');
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const now = new Date();
    const adminId = new Types.ObjectId(req.auth!.userId);

    host.verificationStatus = 'suspended';
    host.kycStatus = 'suspended';
    host.isActive = false;
    host.reviewedAt = now;
    host.reviewedBy = adminId;
    host.rejectionReason = input.reason;
    await host.save();

    // Unpublish all properties of this host
    await Property.updateMany({ host: host._id }, { $set: { isPublished: false, isVerified: false, verificationStatus: 'SUSPENDED' } });

    await AuditLog.create({
      actor: adminId,
      action: 'HOST_SUSPENDED',
      targetType: 'Host',
      targetId: host._id,
      metadata: { reason: input.reason },
    });

    const userObj = (host.user as any);
    if (userObj?.email) {
      sendHostVerificationStatusEmail({
        hostName: userObj.name || 'Host',
        hostEmail: userObj.email,
        status: 'suspended',
        rejectionReason: input.reason,
      }).catch((err: unknown) => console.error('[AdminRoute] Host verification status email error:', err));
    }

    res.json({
      success: true,
      data: {
        message: 'Host suspended and all properties unpublished successfully.',
        host,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/verification/queue & GET /api/admin/verifications/properties
 * Fetch detailed verification review queue items
 */
router.get(['/verification/queue', '/verifications/properties'], async (req, res, next) => {
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

    res.json({ success: true, data: { queue: queueItems, properties } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/verifications/properties/:id
 * Get single property verification details
 */
router.get('/verifications/properties/:id', async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate({
      path: 'host',
      populate: { path: 'user', select: 'name email phone avatarUrl' },
    });

    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    const hostObj = property.host as any;
    const hostId = hostObj?._id;

    const [ownerVerif, propVerif, documents, rooms] = await Promise.all([
      hostId ? OwnerVerification.findOne({ host: hostId }) : null,
      PropertyVerification.findOne({ property: property._id }),
      PropertyVerificationDocument.find({ property: property._id }),
      Room.find({ property: property._id }),
    ]);

    res.json({
      success: true,
      data: {
        property,
        host: hostObj,
        ownerVerification: ownerVerif,
        propertyVerification: propVerif,
        documents,
        rooms,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/properties/:id/verify
 * POST /api/admin/verifications/properties/:id/approve
 * POST /api/admin/verifications/properties/:id/reject
 * POST /api/admin/verifications/properties/:id/suspend
 */
const reviewPropertyHandler = async (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    const propId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let targetStatus: 'VERIFIED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'SUSPENDED';

    if (req.path.endsWith('/approve')) targetStatus = 'VERIFIED';
    else if (req.path.endsWith('/reject')) targetStatus = 'REJECTED';
    else if (req.path.endsWith('/suspend')) targetStatus = 'SUSPENDED';
    else targetStatus = req.body.status;

    const reason = req.body.reason;

    if (targetStatus === 'CHANGES_REQUESTED' && (!reason || reason.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: { code: 'REASON_REQUIRED', message: 'Please provide a clear reason when requesting changes.' },
      });
      return;
    }

    const property = await Property.findById(propId);
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    // Check host verification status before allowing property to become LIVE
    const hostDoc = await Host.findById(property.host);
    const isHostVerified = hostDoc?.verificationStatus === 'verified' && hostDoc.isActive;

    const session = await Property.startSession();
    await session.withTransaction(async () => {
      property.verificationStatus = targetStatus;
      property.rejectionReason = reason;

      if (targetStatus === 'VERIFIED') {
        property.isVerified = true;
        property.isPublished = isHostVerified; // Server-side guard: host verified + property verified
      } else {
        property.isVerified = false;
        property.isPublished = false;
      }
      await property.save({ session });

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
        targetStatus === 'VERIFIED'
          ? 'verified'
          : targetStatus === 'CHANGES_REQUESTED'
          ? 'changes_requested'
          : targetStatus === 'SUSPENDED'
          ? 'suspended'
          : 'rejected';
      propVerif.rejectionReason = reason;
      propVerif.reviewedBy = new Types.ObjectId(req.auth!.userId);
      propVerif.reviewedAt = new Date();
      if (targetStatus === 'VERIFIED') {
        propVerif.verifiedAt = new Date();
      }
      await propVerif.save({ session });

      await AuditLog.create(
        [
          {
            actor: req.auth!.userId,
            action:
              targetStatus === 'VERIFIED'
                ? 'PROPERTY_VERIFIED'
                : targetStatus === 'CHANGES_REQUESTED'
                ? 'PROPERTY_CHANGES_REQUESTED'
                : targetStatus === 'SUSPENDED'
                ? 'PROPERTY_SUSPENDED'
                : 'PROPERTY_REJECTED',
            targetType: 'Property',
            targetId: property._id,
            metadata: { reason },
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
    if (hostUser?.email && (targetStatus === 'VERIFIED' || targetStatus === 'REJECTED' || targetStatus === 'CHANGES_REQUESTED' || targetStatus === 'SUSPENDED')) {
      sendPropertyStatusEmail({
        hostName: hostUser.name || 'Host',
        hostEmail: hostUser.email,
        propertyTitle: property.title,
        status: targetStatus === 'SUSPENDED' ? 'REJECTED' : targetStatus,
        rejectionReason: reason,
      }).catch((err: unknown) => console.error('[AdminRoute] Property status email error:', err));
    }

    res.json({ success: true, data: { property } });
  } catch (error) {
    next(error);
  }
};

router.put('/properties/:id/verify', reviewPropertyHandler);
router.post('/verifications/properties/:id/approve', reviewPropertyHandler);
router.post('/verifications/properties/:id/reject', reviewPropertyHandler);
router.post('/verifications/properties/:id/suspend', reviewPropertyHandler);

export default router;
