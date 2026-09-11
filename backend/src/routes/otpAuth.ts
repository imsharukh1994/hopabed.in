import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Host } from '../models/Host.js';
import { Property } from '../models/Property.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { createAccessToken, requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/emailService.js';
import { sendSmsOTP, normalizeIndianPhoneNumber } from '../services/smsService.js';

const router = Router();

function publicUser(user: {
  _id?: unknown;
  id?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isEmailVerified: Boolean(user.isEmailVerified),
    isPhoneVerified: Boolean(user.isPhoneVerified),
  };
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * POST /api/auth/otp/send
 * Unified Email and Mobile OTP Generator
 * NEVER returns OTP in API response or logs OTP
 */
router.post('/otp/send', async (req, res, next) => {
  try {
    const input = z
      .object({
        identifier: z.string().trim().min(1),
        identifierType: z.enum(['email', 'mobile']),
      })
      .parse(req.body);

    let normalizedIdentifier = input.identifier;
    if (input.identifierType === 'email') {
      normalizedIdentifier = input.identifier.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedIdentifier)) {
        res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' } });
        return;
      }
    } else {
      try {
        normalizedIdentifier = normalizeIndianPhoneNumber(input.identifier);
      } catch {
        res.status(400).json({ success: false, error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit Indian phone number.' } });
        return;
      }
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentRequestsCount = await OtpVerification.countDocuments({
      identifier: normalizedIdentifier,
      createdAt: { $gte: tenMinutesAgo },
    });

    if (recentRequestsCount >= 3) {
      res.status(429).json({
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
      });
      return;
    }

    const lastOtp = await OtpVerification.findOne({ identifier: normalizedIdentifier }).sort({ createdAt: -1 });
    if (lastOtp && lastOtp.resendAvailableAt > new Date()) {
      const waitSeconds = Math.ceil((lastOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      res.status(429).json({
        success: false,
        error: { code: 'RESEND_COOLDOWN', message: `Please wait ${waitSeconds} seconds before requesting a new code.` },
      });
      return;
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    const resendAvailableAt = new Date(Date.now() + 30 * 1000); // 30 seconds cooldown

    await OtpVerification.create({
      identifier: normalizedIdentifier,
      identifierType: input.identifierType,
      otpHash,
      expiresAt,
      resendAvailableAt,
      purpose: 'login_register',
    });

    // Send OTP via Email or SMS
    if (input.identifierType === 'email') {
      const emailResult = await sendOtpEmail({ email: normalizedIdentifier, otp });
      if (!emailResult.success) {
        res.status(500).json({ success: false, error: { message: 'Failed to deliver verification email. Please check address.' } });
        return;
      }
    } else {
      const smsResult = await sendSmsOTP({ to: normalizedIdentifier, otp });
      if (!smsResult.success) {
        res.status(500).json({ success: false, error: { message: 'Failed to deliver SMS verification code.' } });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        message: `Verification code sent to ${input.identifierType === 'email' ? normalizedIdentifier : normalizedIdentifier.slice(0, 6) + 'XXXX'}`,
        identifierType: input.identifierType,
        resendCooldownSeconds: 30,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/otp/verify
 * Unified Verification, Login, Registration, and Account Linking
 */
router.post('/otp/verify', async (req, res, next) => {
  try {
    const input = z
      .object({
        identifier: z.string().trim().min(1),
        identifierType: z.enum(['email', 'mobile']),
        otp: z.string().trim().length(6),
        isOwnerFlow: z.boolean().optional(),
      })
      .parse(req.body);

    let normalizedIdentifier = input.identifier;
    if (input.identifierType === 'email') {
      normalizedIdentifier = input.identifier.toLowerCase();
    } else {
      try {
        normalizedIdentifier = normalizeIndianPhoneNumber(input.identifier);
      } catch {
        res.status(400).json({ success: false, error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit Indian phone number.' } });
        return;
      }
    }

    const record = await OtpVerification.findOne({
      identifier: normalizedIdentifier,
      purpose: 'login_register',
      verifiedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    if (!record) {
      res.status(400).json({ success: false, error: { code: 'OTP_NOT_FOUND', message: 'No active verification code found. Please request a new code.' } });
      return;
    }

    if (record.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: { code: 'OTP_EXPIRED', message: 'Verification code has expired. Please request a new code.' } });
      return;
    }

    if (record.attemptCount >= 5) {
      res.status(429).json({ success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Code invalidated.' } });
      return;
    }

    const providedHash = hashOtp(input.otp);
    if (record.otpHash !== providedHash) {
      record.attemptCount += 1;
      await record.save();
      const remaining = 5 - record.attemptCount;
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: `Incorrect verification code. ${remaining} attempts remaining.` },
      });
      return;
    }

    // Mark OTP as verified (single-use)
    record.verifiedAt = new Date();
    await record.save();

    // Account Creation / Unified Login & Safe Account Linking
    let user;
    let isNewUser = false;

    if (input.identifierType === 'email') {
      user = await User.findOne({ email: normalizedIdentifier });
      if (!user) {
        isNewUser = true;
        const nameFromEmail = normalizedIdentifier.split('@')[0];
        const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        user = await User.create({
          name: formattedName,
          email: normalizedIdentifier,
          authProvider: 'password',
          isEmailVerified: true,
          role: 'guest',
        });
        sendWelcomeEmail({ name: user.name, email: user.email }).catch(console.error);
      } else {
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await user.save();
        }
      }
    } else {
      // Mobile OTP
      user = await User.findOne({ phone: normalizedIdentifier });
      if (!user) {
        isNewUser = true;
        const defaultName = `Guest ${normalizedIdentifier.slice(-4)}`;
        const dummyEmail = `${normalizedIdentifier.replace('+', '')}@mobile.hopebed.in`;
        user = await User.create({
          name: defaultName,
          email: dummyEmail,
          phone: normalizedIdentifier,
          authProvider: 'password',
          isPhoneVerified: true,
          role: 'guest',
        });
      } else {
        if (!user.isPhoneVerified) {
          user.isPhoneVerified = true;
          await user.save();
        }
      }
    }

    // Owner Flow Auto Draft Creation
    let firstPropertyId: string | undefined;
    if (input.isOwnerFlow) {
      let host = await Host.findOne({ user: user._id });
      if (!host) {
        host = await Host.create({
          user: user._id,
          verificationStatus: 'unverified',
          kycStatus: 'not_started',
        });
        user.role = 'host';
        await user.save();
      }

      let property = await Property.findOne({ host: host._id }).sort({ createdAt: -1 });
      if (!property) {
        const defaultTitle = 'My First Property Draft';
        const slug = defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

        property = await Property.create({
          host: host._id,
          title: defaultTitle,
          slug,
          propertyType: 'hotel',
          category: 'stay',
          city: 'Navi Mumbai',
          locality: 'Kharghar',
          state: 'Maharashtra',
          country: 'India',
          address: 'Address to be updated',
          bedrooms: 1,
          bathrooms: 1,
          maxGuests: 2,
          pricePerNight: 2000,
          currency: 'INR',
          description: 'Welcome to your property draft on Hopebed. Complete property details, pricing, rooms, and verification to go live.',
          amenities: ['WiFi', 'AC'],
          isVerified: false,
          isPublished: false,
          verificationStatus: 'DRAFT',
        });
        await Host.findByIdAndUpdate(host._id, { propertyCount: 1 });
      }
      firstPropertyId = String(property._id);
    }

    const token = createAccessToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        user: publicUser(user),
        token,
        isNewUser,
        firstPropertyId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
