import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
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

    // Generate unique PayU reference ID starting with HB_
    const txnid = 'HB_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now();
    const amount = booking.totalAmount.toFixed(2);
    const productinfo = `Booking ${booking._id}`;
    const firstname = user.name.split(' ')[0] || 'Guest';
    const email = user.email;

    const key = env.PAYU_MERCHANT_KEY;
    const salt = env.PAYU_MERCHANT_SALT;
    const isTest = env.PAYU_ENV !== 'production';
    const payuUrl = isTest ? 'https://test.payu.in/_payment' : 'https://secure.payu.in/_payment';
    
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
        payuUrl,
        key,
        txnid, 
        amount, 
        productinfo,
        firstname,
        email,
        phone: '9999999999',
        surl: `${env.API_URL}/api/payments/payu-success`,
        furl: `${env.API_URL}/api/payments/payu-failure`,
        hash
      } 
    });
  } catch (error) {
    next(error);
  }
});

// PayU Success Redirect (Form POST from PayU) - Not the final source of truth
router.post('/payu-success', async (req, res, next) => {
  try {
    const frontendUrl = env.FRONTEND_URL;
    // We just redirect to the frontend. We don't mark as confirmed here.
    res.redirect(`${frontendUrl}/bookings?success=true`);
  } catch (error) {
    console.error('PayU success redirect error:', error);
    res.redirect(`${env.FRONTEND_URL}/bookings?error=internal_error`);
  }
});

// PayU Failure Redirect
router.post('/payu-failure', async (req, res, next) => {
  try {
    const frontendUrl = env.FRONTEND_URL;
    res.redirect(`${frontendUrl}/bookings?error=payment_failed`);
  } catch (error) {
    res.redirect(`${env.FRONTEND_URL}/bookings?error=internal_error`);
  }
});

// PayU Webhook - The real source of truth
router.post('/payu-webhook', async (req, res, next) => {
  try {
    const { txnid, amount, productinfo, firstname, email, status, hash } = req.body;
    
    const key = env.PAYU_MERCHANT_KEY;
    const salt = env.PAYU_MERCHANT_SALT;
    
    // Verify reverse hash: sha512(SALT|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = sha512(reverseHashString);

    const hashBuf = Buffer.from(typeof hash === 'string' ? hash : '', 'utf-8');
    const calcBuf = Buffer.from(calculatedHash, 'utf-8');

    if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
      console.error('PayU Webhook Signature mismatch for txnid:', txnid);
      res.status(400).send('Invalid signature');
      return;
    }

    const payment = await Payment.findOne({ orderId: txnid });
    if (!payment) {
      res.status(404).send('Payment not found');
      return;
    }

    // Idempotency check
    if (payment.status === 'captured' || payment.status === 'failed' || payment.status === 'refunded') {
      res.status(200).send('Already processed');
      return;
    }

    // Amount verification
    if (parseFloat(amount) !== payment.amount) {
      console.error('Amount mismatch in webhook for txnid:', txnid);
      res.status(400).send('Amount mismatch');
      return;
    }

    if (status === 'success') {
      payment.status = 'captured';
      // Record raw PayU payload as metadata for audit
      payment.metadata = { ...payment.metadata, payuWebhookResponse: req.body };
      await payment.save();
      
      const booking = await Booking.findById(payment.booking);
      if (booking && booking.paymentStatus !== 'PAID') {
        booking.paymentStatus = 'PAID';
        booking.status = 'confirmed';
        await booking.save();
      }
    } else {
      payment.status = 'failed';
      payment.metadata = { ...payment.metadata, payuWebhookResponse: req.body };
      await payment.save();
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('PayU webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Server-to-Server Verification
router.post('/payu-verify', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z.object({ bookingId: z.string() }).parse(req.body);
    const userId = req.auth?.userId;
    
    const payment = await Payment.findOne({ booking: input.bookingId, user: userId }).sort({ createdAt: -1 });
    if (!payment) {
      res.status(404).json({ success: false, error: { message: 'Payment not found' } });
      return;
    }

    const key = env.PAYU_MERCHANT_KEY;
    const salt = env.PAYU_MERCHANT_SALT;
    const txnid = payment.orderId;
    const command = 'verify_payment';
    
    // Hash format for verification: sha512(key|command|var1|salt)
    const hashStr = `${key}|${command}|${txnid}|${salt}`;
    const hash = sha512(hashStr);

    const isTest = env.PAYU_ENV !== 'production';
    const verifyUrl = isTest ? 'https://test.payu.in/merchant/postservice?form=2' : 'https://info.payu.in/merchant/postservice.php?form=2';

    const verifyForm = new URLSearchParams();
    verifyForm.append('key', key);
    verifyForm.append('command', command);
    verifyForm.append('hash', hash);
    if(txnid) {
        verifyForm.append('var1', txnid);
    }

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyForm.toString()
    });

    const body = (await response.json()) as any;
    
    if (body.status === 1 && body.transaction_details && body.transaction_details[txnid || '']) {
      const txDetails = body.transaction_details[txnid || ''];
      
      // Update DB if verify status is successful but DB is pending
      if (txDetails.status === 'success' && payment.status !== 'captured') {
        payment.status = 'captured';
        await payment.save();
        await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'PAID', status: 'confirmed' });
      } else if (txDetails.status === 'failure' && payment.status === 'pending') {
        payment.status = 'failed';
        await payment.save();
      }

      res.status(200).json({ success: true, data: { status: txDetails.status } });
    } else {
      res.status(400).json({ success: false, error: { message: 'Verification failed' } });
    }
  } catch (error) {
    next(error);
  }
});

// Server-to-Server Refund
router.post('/payu-refund', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z.object({ bookingId: z.string(), amount: z.number().optional() }).parse(req.body);
    const userId = req.auth?.userId;
    
    const payment = await Payment.findOne({ booking: input.bookingId, status: 'captured' });
    if (!payment) {
      res.status(404).json({ success: false, error: { message: 'Valid payment not found for refund' } });
      return;
    }

    const booking = await Booking.findById(payment.booking);
    // Only hosts or admins or the original user should be able to refund, basic check:
    if (!booking || (booking.guest.toString() !== userId && booking.host.toString() !== userId)) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized to refund this booking' } });
      return;
    }

    const refundAmount = input.amount || payment.amount;
    const txnid = payment.paymentId || payment.orderId; // Usually need the PayU ID (mihpayid), but fallback to txnid
    const cancelRefundToken = 'REF_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now();

    const key = env.PAYU_MERCHANT_KEY;
    const salt = env.PAYU_MERCHANT_SALT;
    const command = 'cancel_refund_transaction';
    
    // Hash format: sha512(key|command|var1|salt)
    const hashStr = `${key}|${command}|${txnid}|${salt}`;
    const hash = sha512(hashStr);

    const isTest = env.PAYU_ENV !== 'production';
    const url = isTest ? 'https://test.payu.in/merchant/postservice?form=2' : 'https://info.payu.in/merchant/postservice.php?form=2';

    const params = new URLSearchParams();
    params.append('key', key);
    params.append('command', command);
    params.append('hash', hash);
    if(txnid) {
        params.append('var1', txnid);
    }
    params.append('var2', cancelRefundToken);
    params.append('var3', refundAmount.toString());

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const body = (await response.json()) as any;
    if (body.status === 1) {
      payment.status = 'refunded';
      payment.metadata = { ...payment.metadata, refundResponse: body };
      await payment.save();
      
      booking.status = 'cancelled';
      booking.paymentStatus = 'REFUNDED';
      await booking.save();
      
      res.status(200).json({ success: true, data: { message: 'Refund initiated successfully', refundId: body.request_id } });
    } else {
      res.status(400).json({ success: false, error: { message: body.msg || 'Refund failed' } });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
