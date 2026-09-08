import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { Types } from 'mongoose';
import { sha512 } from 'js-sha512';

const router = Router();

// PayU hash generation format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
router.post('/payu-init', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z.object({ bookingId: z.string() }).parse(req.body);
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const booking = await Booking.findOne({ _id: input.bookingId, guest: userId });
    if (!booking) {
      res.status(404).json({ success: false, error: { message: 'Booking not found' } });
      return;
    }

    if (booking.paymentStatus === 'PAID') {
      res.status(400).json({ success: false, error: { message: 'Booking is already paid' } });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    const txnid = 'txnid_' + Math.random().toString(36).substring(2, 15);
    const amount = booking.totalAmount.toFixed(2);
    const productinfo = `Booking ${booking._id}`;
    const firstname = user.name.split(' ')[0] || 'Guest';
    const email = user.email;

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    
    // Hash sequence
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = sha512(hashString);

    // Create the Payment record in our DB
    await Payment.create({
      booking: booking._id,
      user: userId,
      amount: booking.totalAmount,
      currency: 'INR',
      paymentGateway: 'payu',
      orderId: txnid,
      status: 'pending',
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        key,
        txnid, 
        amount, 
        productinfo,
        firstname,
        email,
        phone: '9999999999', // dummy phone
        surl: `${process.env.API_URL || 'http://localhost:4000'}/api/payments/payu-success`,
        furl: `${process.env.API_URL || 'http://localhost:4000'}/api/payments/payu-failure`,
        hash
      } 
    });
  } catch (error) {
    next(error);
  }
});

// PayU Success Webhook/Callback (Form POST from PayU)
router.post('/payu-success', async (req, res, next) => {
  try {
    const { txnid, amount, productinfo, firstname, email, status, hash, error_Message } = req.body;
    
    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    
    // Verify reverse hash: sha512(SALT|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = sha512(reverseHashString);

    if (calculatedHash !== hash) {
      console.error('PayU Signature mismatch!');
      return res.redirect('http://localhost:3000/bookings?error=signature_mismatch');
    }

    if (status === 'success') {
      const payment = await Payment.findOne({ orderId: txnid });
      if (payment && payment.status !== 'captured') {
        payment.status = 'captured';
        await payment.save();
        await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'PAID', status: 'confirmed' });
      }
      return res.redirect('http://localhost:3000/bookings?success=true');
    }

    return res.redirect('http://localhost:3000/bookings?error=payment_failed');
  } catch (error) {
    console.error('PayU success error:', error);
    res.redirect('http://localhost:3000/bookings?error=internal_error');
  }
});

// PayU Failure Webhook/Callback
router.post('/payu-failure', async (req, res, next) => {
  try {
    const { txnid } = req.body;
    if (txnid) {
      await Payment.findOneAndUpdate({ orderId: txnid }, { status: 'failed' });
    }
    return res.redirect('http://localhost:3000/bookings?error=payment_failed');
  } catch (error) {
    res.redirect('http://localhost:3000/bookings?error=internal_error');
  }
});

export default router;
