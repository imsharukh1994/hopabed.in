import { Router } from 'express';
import { z } from 'zod';
import { Host } from '../models/Host.js';
import { User } from '../models/User.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

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

export default router;
