import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sha512 } from 'js-sha512';

const TEST_PORT = 5007;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

async function runPayUProductionTests() {
  console.log('=== STARTING TASK #4 PAYU PRODUCTION INTEGRATION AUDIT & TESTS ===\n');

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  process.env.NODE_ENV = 'test';

  // Dynamic import after env loaded
  const { app } = await import('../src/index.js');
  const { Booking } = await import('../src/models/Booking.js');
  const { Property } = await import('../src/models/Property.js');
  const { Room } = await import('../src/models/Room.js');
  const { User } = await import('../src/models/User.js');
  const { Host } = await import('../src/models/Host.js');
  const { Payment } = await import('../src/models/Payment.js');
  const { createAccessToken } = await import('../src/middleware/auth.js');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const server = app.listen(TEST_PORT);
  console.log(`Test Express server running on port ${TEST_PORT}.\n`);

  try {
    // Clear previous test records
    await Booking.deleteMany({ notes: 'TASK4_PAYU_TEST' });
    await Payment.deleteMany({ currency: 'INR_PAYU_TEST' });

    // 1. Setup Users (User A & User B)
    let userA = await User.findOne({ email: 'payu_user_a@example.com' });
    if (!userA) {
      userA = await User.create({
        name: 'PayU User A',
        email: 'payu_user_a@example.com',
        authProvider: 'password',
        role: 'guest',
        isEmailVerified: true,
        isPhoneVerified: true
      });
    }

    let userB = await User.findOne({ email: 'payu_user_b@example.com' });
    if (!userB) {
      userB = await User.create({
        name: 'PayU User B',
        email: 'payu_user_b@example.com',
        authProvider: 'password',
        role: 'guest',
        isEmailVerified: true,
        isPhoneVerified: true
      });
    }

    const tokenA = createAccessToken(userA._id.toString(), userA.role as any);
    const tokenB = createAccessToken(userB._id.toString(), userB.role as any);

    // 2. Setup Host, Property & Room
    let host = await Host.findOne({ businessName: 'PayU Host Business' });
    if (!host) {
      host = await Host.create({
        user: userA._id,
        businessName: 'PayU Host Business',
        verificationStatus: 'verified'
      });
    }

    let property = await Property.findOne({ slug: 'payu-test-property' });
    if (!property) {
      property = await Property.create({
        host: host._id,
        title: 'PayU Test Beach Resort',
        slug: 'payu-test-property',
        description: 'Test resort for PayU verification',
        city: 'Goa',
        state: 'Goa',
        locality: 'Baga',
        propertyType: 'villa',
        address: '50 Baga Beach',
        location: { type: 'Point', coordinates: [73.75, 15.55] },
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        pricePerNight: 2000,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        isPublished: true
      });
    }

    let room = await Room.findOne({ property: property._id, name: 'PayU Deluxe Room' });
    if (!room) {
      room = await Room.create({
        property: property._id,
        name: 'PayU Deluxe Room',
        roomType: 'private',
        capacity: 2,
        inventory: 10,
        pricePerNight: 2000,
        isActive: true
      });
    }

    // Create Booking for User A (1 night = 2000 subtotal + 100 fee + 105 tax = 2205 total)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 6);

    const bookingA = await Booking.create({
      property: property._id,
      guest: userA._id,
      host: host._id,
      room: room._id,
      checkIn: tomorrow,
      checkOut: dayAfter,
      nights: 1,
      guests: 2,
      roomCount: 1,
      pricePerNight: 2000,
      subtotal: 2000,
      serviceFee: 100,
      taxes: 105,
      totalAmount: 2205,
      currency: 'INR',
      notes: 'TASK4_PAYU_TEST',
      status: 'pending',
      paymentStatus: 'UNPAID'
    });

    console.log(`Test Booking Created: ID ${bookingA._id}, TotalAmount: ₹${bookingA.totalAmount}\n`);

    // --- TEST 1 & 2: PayU Initialization & Client Amount Modification Immunity ---
    console.log('--- TEST 1 & 2: PAYU INITIALIZATION & AMOUNT IMMUNITY ---');
    const initRes = await fetch(`${API_BASE}/payments/payu-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        bookingId: bookingA._id.toString(),
        amount: 1, // Tampered client amount
        totalAmount: 1
      })
    });

    const initBody: any = await initRes.json();
    console.log('Initialization Status:', initRes.status);
    if (!initRes.ok || !initBody.data) {
      console.error('FAILED TEST 1 & 2:', initBody);
      process.exit(1);
    }

    const { payuUrl, txnid, amount, hash } = initBody.data;
    console.log(`Returned PayU URL: ${payuUrl}`);
    console.log(`Generated txnid: ${txnid}`);
    console.log(`Returned Amount: ${amount} (Expected 2205.00)`);
    console.log(`Server generated hash length: ${hash.length} chars`);

    if (amount !== '2205.00') {
      console.error('FAILED TEST 1 & 2: PayU initialization used tampered amount!');
      process.exit(1);
    }
    console.log('PASS TEST 1 & 2: PayU initialization used authoritative DB amount ₹2205.00!\n');

    // --- TEST 3: Invalid PayU Webhook Signature ---
    console.log('--- TEST 3: INVALID PAYU WEBHOOK SIGNATURE ---');
    const invalidSignatureWebhook = await fetch(`${API_BASE}/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txnid,
        amount: '2205.00',
        productinfo: `Booking ${bookingA._id}`,
        firstname: 'PayU',
        email: userA.email,
        status: 'success',
        hash: 'INVALID_TAMPERED_HASH_SIGNATURE'
      })
    });

    console.log(`Invalid Signature Webhook Status: ${invalidSignatureWebhook.status} (Expected 400)`);
    if (invalidSignatureWebhook.status !== 400) {
      console.error('FAILED TEST 3: System accepted invalid hash!');
      process.exit(1);
    }
    console.log('PASS TEST 3: Invalid webhook signature rejected with HTTP 400!\n');

    // --- TEST 4: Tampered Callback Amount in Webhook ---
    console.log('--- TEST 4: TAMPERED CALLBACK AMOUNT IN WEBHOOK ---');
    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    const productinfo = `Booking ${bookingA._id}`;
    const firstname = 'PayU';
    const email = userA.email;

    // Generate valid reverse hash for ₹1 amount attempt
    const tamperedAmountStr = '1.00';
    const tamperedHashStr = `${salt}|success|||||||||||${email}|${firstname}|${productinfo}|${tamperedAmountStr}|${txnid}|${key}`;
    const tamperedHash = sha512(tamperedHashStr);

    const tamperedWebhookRes = await fetch(`${API_BASE}/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txnid,
        amount: tamperedAmountStr,
        productinfo,
        firstname,
        email,
        status: 'success',
        hash: tamperedHash
      })
    });

    console.log(`Tampered Amount Webhook Status: ${tamperedWebhookRes.status} (Expected 400 Amount mismatch)`);
    if (tamperedWebhookRes.status !== 400) {
      console.error('FAILED TEST 4: System accepted tampered amount in webhook!');
      process.exit(1);
    }
    console.log('PASS TEST 4: Webhook amount mismatch rejected with HTTP 400!\n');

    // --- TEST 5: Tampered Reference / Non-existent txnid ---
    console.log('--- TEST 5: NON-EXISTENT TRANSACTION ID ---');
    const fakeTxnid = 'HB_NONEXISTENT_99999';
    const fakeHashStr = `${salt}|success|||||||||||${email}|${firstname}|${productinfo}|2205.00|${fakeTxnid}|${key}`;
    const fakeHash = sha512(fakeHashStr);

    const fakeTxnidRes = await fetch(`${API_BASE}/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txnid: fakeTxnid,
        amount: '2205.00',
        productinfo,
        firstname,
        email,
        status: 'success',
        hash: fakeHash
      })
    });

    console.log(`Non-existent Txnid Webhook Status: ${fakeTxnidRes.status} (Expected 404)`);
    if (fakeTxnidRes.status !== 404) {
      console.error('FAILED TEST 5: System did not reject non-existent txnid!');
      process.exit(1);
    }
    console.log('PASS TEST 5: Non-existent txnid rejected with HTTP 404!\n');

    // --- TEST 6: Real Successful Webhook & Idempotency ---
    console.log('--- TEST 6: REAL SUCCESSFUL PAYU WEBHOOK & IDEMPOTENCY ---');
    const validAmountStr = '2205.00';
    const validHashStr = `${salt}|success|||||||||||${email}|${firstname}|${productinfo}|${validAmountStr}|${txnid}|${key}`;
    const validHash = sha512(validHashStr);

    const validWebhookRes = await fetch(`${API_BASE}/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txnid,
        amount: validAmountStr,
        productinfo,
        firstname,
        email,
        status: 'success',
        hash: validHash
      })
    });

    const webhookText1 = await validWebhookRes.text();
    console.log(`Webhook 1 Response: "${webhookText1}" (Status ${validWebhookRes.status})`);
    if (validWebhookRes.status !== 200) {
      console.error('FAILED TEST 6: Valid webhook failed!');
      process.exit(1);
    }

    // Verify DB update
    const dbBookingAfter = await Booking.findById(bookingA._id);
    const dbPaymentAfter = await Payment.findOne({ orderId: txnid });

    console.log(`Updated Booking Status: ${dbBookingAfter?.status} (Expected 'confirmed')`);
    console.log(`Updated Booking PaymentStatus: ${dbBookingAfter?.paymentStatus} (Expected 'PAID')`);
    console.log(`Updated Payment Status: ${dbPaymentAfter?.status} (Expected 'captured')`);

    if (dbBookingAfter?.status !== 'confirmed' || dbBookingAfter?.paymentStatus !== 'PAID' || dbPaymentAfter?.status !== 'captured') {
      console.error('FAILED TEST 6: DB state not updated properly!');
      process.exit(1);
    }

    // DUPLICATE WEBHOOK SEND
    console.log('Sending duplicate webhook...');
    const dupWebhookRes = await fetch(`${API_BASE}/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txnid,
        amount: validAmountStr,
        productinfo,
        firstname,
        email,
        status: 'success',
        hash: validHash
      })
    });

    const dupText = await dupWebhookRes.text();
    console.log(`Duplicate Webhook Response: "${dupText}" (Status ${dupWebhookRes.status})`);
    if (dupText !== 'Already processed') {
      console.error('FAILED TEST 6: Duplicate webhook not idempotent!');
      process.exit(1);
    }

    const totalPaymentsForTxn = await Payment.countDocuments({ orderId: txnid });
    console.log(`Total Payment documents for orderId ${txnid}: ${totalPaymentsForTxn}`);
    if (totalPaymentsForTxn !== 1) {
      console.error('FAILED TEST 6: Duplicate payments created!');
      process.exit(1);
    }
    console.log('PASS TEST 6: Webhook processed successfully, state updated to CONFIRMED, & duplicate webhook handled idempotently!\n');

    // --- TEST 7: Failed Payment Webhook ---
    console.log('--- TEST 7: FAILED PAYMENT WEBHOOK ---');
    // Create Booking B
    const bookingB = await Booking.create({
      property: property._id,
      guest: userA._id,
      host: host._id,
      room: room._id,
      checkIn: tomorrow,
      checkOut: dayAfter,
      nights: 1,
      guests: 2,
      roomCount: 1,
      pricePerNight: 2000,
      subtotal: 2000,
      serviceFee: 100,
      taxes: 105,
      totalAmount: 2205,
      currency: 'INR',
      notes: 'TASK4_PAYU_TEST',
      status: 'pending',
      paymentStatus: 'UNPAID'
    });

    // Init PayU for Booking B
    const initBRes = await fetch(`${API_BASE}/payments/payu-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ bookingId: bookingB._id.toString() })
    });
    const initBBody: any = await initBRes.json();
    const txnidB = initBBody.data.txnid;

    // Send failure webhook
    const failHashStr = `${salt}|failure|||||||||||${email}|${firstname}|Booking ${bookingB._id}|2205.00|${txnidB}|${key}`;
    const failHash = sha512(failHashStr);

    const failWebhookRes = await fetch(`${API_BASE}/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txnid: txnidB,
        amount: '2205.00',
        productinfo: `Booking ${bookingB._id}`,
        firstname,
        email,
        status: 'failure',
        hash: failHash
      })
    });

    console.log(`Failure Webhook Status: ${failWebhookRes.status}`);
    const bookingBAfter = await Booking.findById(bookingB._id);
    const paymentBAfter = await Payment.findOne({ orderId: txnidB });

    console.log(`Booking B Status: ${bookingBAfter?.status} (Expected 'pending')`);
    console.log(`Booking B PaymentStatus: ${bookingBAfter?.paymentStatus} (Expected 'UNPAID')`);
    console.log(`Payment B Status: ${paymentBAfter?.status} (Expected 'failed')`);

    if (bookingBAfter?.status === 'confirmed' || paymentBAfter?.status !== 'failed') {
      console.error('FAILED TEST 7: Failed payment incorrectly confirmed booking!');
      process.exit(1);
    }
    console.log('PASS TEST 7: Failed payment marked payment as failed and DID NOT confirm booking!\n');

    // --- TEST 8: Unauthorized Initialization for Another User's Booking ---
    console.log('--- TEST 8: UNAUTHORIZED INITIALIZATION (USER B TRYING USER A BOOKING) ---');
    const unauthRes = await fetch(`${API_BASE}/payments/payu-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ bookingId: bookingA._id.toString() })
    });
    console.log(`Unauthorized Init Status: ${unauthRes.status} (Expected 404)`);
    if (unauthRes.status !== 404) {
      console.error('FAILED TEST 8: User B was able to initialize payment for User A booking!');
      process.exit(1);
    }
    console.log('PASS TEST 8: Cross-user payment initialization blocked with HTTP 404!\n');

    // --- TEST 9: Non-existent Booking ID ---
    console.log('--- TEST 9: NON-EXISTENT BOOKING ID ---');
    const nonExistRes = await fetch(`${API_BASE}/payments/payu-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ bookingId: '507f1f77bcf86cd799439011' })
    });
    console.log(`Non-existent Booking Status: ${nonExistRes.status} (Expected 404)`);
    if (nonExistRes.status !== 404) {
      console.error('FAILED TEST 9: Non-existent booking accepted!');
      process.exit(1);
    }
    console.log('PASS TEST 9: Non-existent booking ID rejected with HTTP 404!\n');

    // --- TEST 10: Already-Paid Booking Initialization ---
    console.log('--- TEST 10: ALREADY-PAID BOOKING INITIALIZATION RETRY ---');
    const alreadyPaidRes = await fetch(`${API_BASE}/payments/payu-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ bookingId: bookingA._id.toString() })
    });
    console.log(`Already Paid Retry Status: ${alreadyPaidRes.status} (Expected 400)`);
    if (alreadyPaidRes.status !== 400) {
      console.error('FAILED TEST 10: Already paid booking permitted re-initialization!');
      process.exit(1);
    }
    console.log('PASS TEST 10: Retrying payu-init for paid booking rejected with HTTP 400!\n');

    // Cleanup test records
    await Booking.deleteMany({ notes: 'TASK4_PAYU_TEST' });
    await Property.deleteOne({ _id: property._id });
    await Room.deleteMany({ property: property._id });
    await Payment.deleteMany({ user: { $in: [userA._id, userB._id] } });

    console.log('=== ALL TASK #4 PAYU PRODUCTION INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runPayUProductionTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
