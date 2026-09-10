import mongoose from 'mongoose';
import crypto from 'crypto';
import { sha512 } from 'js-sha512';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Host } from '../src/models/Host.js';
import { Property } from '../src/models/Property.js';
import { Room } from '../src/models/Room.js';
import { Booking } from '../src/models/Booking.js';
import { Payment } from '../src/models/Payment.js';

function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  salt: string;
}): string {
  // sha512(SALT|status|||||||||||email|firstname|productinfo|amount|txnid|key)
  const reverseHashString = `${params.salt}|${params.status}|||||||||||${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${params.key}`;
  return sha512(reverseHashString);
}

async function runIdempotencyTests() {
  console.log('=== STARTING PAYU WEBHOOK IDEMPOTENCY TEST SUITE ===\n');

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log('Connected to MongoDB.');

  // Clean test fixtures
  const testEmail = `idempotency_${Date.now()}@example.com`;
  const user = await User.create({
    name: 'Idempotency Test User',
    email: testEmail,
    passwordHash: 'hashed_password_for_testing_123',
    role: 'guest',
  });

  const hostUser = await User.create({
    name: 'Idempotency Test Host',
    email: `host_${Date.now()}@example.com`,
    passwordHash: 'hashed_password_for_testing_123',
    role: 'host',
  });

  const host = await Host.create({
    user: hostUser._id,
    businessName: 'Idempotency Test Hospitality',
    verificationStatus: 'verified',
  });

  const property = await Property.create({
    host: host._id,
    title: 'Idempotency Test Villa',
    slug: `idempotency-test-${Date.now()}`,
    propertyType: 'villa',
    category: 'stay',
    city: 'Mumbai',
    locality: 'Bandra',
    state: 'Maharashtra',
    country: 'India',
    address: '123 Ocean Drive',
    location: { type: 'Point', coordinates: [72.82, 19.05] },
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    pricePerNight: 5000,
    currency: 'INR',
    description: 'Test Property for PayU Idempotency',
    amenities: ['wifi'],
    houseRules: [],
    isVerified: true,
    isPublished: true,
    verificationStatus: 'VERIFIED',
  });

  const room = await Room.create({
    property: property._id,
    name: 'Executive Suite',
    roomType: 'private',
    capacity: 2,
    inventory: 5,
    pricePerNight: 5000,
    currency: 'INR',
    amenities: ['wifi'],
    isActive: true,
  });

  const booking = await Booking.create({
    property: property._id,
    guest: user._id,
    host: host._id,
    room: room._id,
    checkIn: new Date('2026-11-01'),
    checkOut: new Date('2026-11-04'),
    nights: 3,
    guests: 2,
    roomCount: 1,
    pricePerNight: 5000,
    subtotal: 15000,
    serviceFee: 1500,
    taxes: 2700,
    totalAmount: 19200,
    status: 'pending',
    paymentStatus: 'UNPAID',
    currency: 'INR',
  });

  const txnid = `HB_IDEM_${Date.now()}`;
  const payment = await Payment.create({
    orderId: txnid,
    booking: booking._id,
    user: user._id,
    amount: 19200,
    currency: 'INR',
    status: 'pending',
    gateway: 'payu',
  });

  console.log(`Created Test Booking ID: ${booking._id}`);
  console.log(`Created Test Payment Transaction ID: ${txnid}\n`);

  const key = env.PAYU_MERCHANT_KEY;
  const salt = env.PAYU_MERCHANT_SALT;

  const validSuccessPayload = {
    txnid,
    amount: '19200',
    productinfo: 'Hopebed Sea View Villa',
    firstname: user.name,
    email: user.email,
    status: 'success',
    hash: generatePayUHash({
      key,
      salt,
      txnid,
      amount: '19200',
      productinfo: 'Hopebed Sea View Villa',
      firstname: user.name,
      email: user.email,
      status: 'success',
    }),
  };

  const API_URL = env.API_URL;

  // Helper to post webhook
  async function postWebhook(payload: any) {
    const res = await fetch(`${API_URL}/api/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return { status: res.status, text };
  }

  // -------------------------------------------------------------------------
  // TEST 5: Invalid Signature
  // -------------------------------------------------------------------------
  console.log('--- TEST 5: Invalid Signature Protection ---');
  const invalidSigPayload = { ...validSuccessPayload, hash: 'corrupted_hash_value' };
  const res5 = await postWebhook(invalidSigPayload);
  console.log(`Status: ${res5.status}, Body: "${res5.text}"`);
  console.log(`Result: ${res5.status === 400 && res5.text.includes('Invalid signature') ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 6: Tampered Amount
  // -------------------------------------------------------------------------
  console.log('--- TEST 6: Tampered Amount Protection ---');
  const tamperedAmountPayload = {
    ...validSuccessPayload,
    amount: '1.00',
    hash: generatePayUHash({
      key,
      salt,
      txnid,
      amount: '1.00',
      productinfo: 'Hopebed Sea View Villa',
      firstname: user.name,
      email: user.email,
      status: 'success',
    }),
  };
  const res6 = await postWebhook(tamperedAmountPayload);
  console.log(`Status: ${res6.status}, Body: "${res6.text}"`);
  console.log(`Result: ${res6.status === 400 && res6.text.includes('Amount mismatch') ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 7: Unknown Transaction ID
  // -------------------------------------------------------------------------
  console.log('--- TEST 7: Unknown Transaction ID Protection ---');
  const unknownTxnId = `HB_UNKNOWN_${Date.now()}`;
  const unknownTxnPayload = {
    ...validSuccessPayload,
    txnid: unknownTxnId,
    hash: generatePayUHash({
      key,
      salt,
      txnid: unknownTxnId,
      amount: '19200',
      productinfo: 'Hopebed Sea View Villa',
      firstname: user.name,
      email: user.email,
      status: 'success',
    }),
  };
  const res7 = await postWebhook(unknownTxnPayload);
  console.log(`Status: ${res7.status}, Body: "${res7.text}"`);
  console.log(`Result: ${res7.status === 404 ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 1: First Valid Successful Webhook
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: First Valid Successful Webhook ---');
  const res1 = await postWebhook(validSuccessPayload);
  console.log(`Status: ${res1.status}, Body: "${res1.text}"`);

  const updatedBooking1 = await Booking.findById(booking._id);
  const updatedPayment1 = await Payment.findById(payment._id);
  console.log(`Payment Status after Webhook 1: ${updatedPayment1?.status}`);
  console.log(`Booking Status after Webhook 1: ${updatedBooking1?.status} (paymentStatus: ${updatedBooking1?.paymentStatus})`);
  console.log(`Result: ${res1.status === 200 && updatedPayment1?.status === 'captured' && updatedBooking1?.status === 'confirmed' ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 2: Duplicate Successful Webhook
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Duplicate Successful Webhook ---');
  const res2 = await postWebhook(validSuccessPayload);
  console.log(`Status: ${res2.status}, Body: "${res2.text}"`);
  console.log(`Result: ${res2.status === 200 && res2.text.includes('Already processed') ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 10: Already Captured Payment Guard
  // -------------------------------------------------------------------------
  console.log('--- TEST 10: Already Captured Payment Protection ---');
  const res10 = await postWebhook(validSuccessPayload);
  console.log(`Status: ${res10.status}, Body: "${res10.text}"`);
  console.log(`Result: ${res10.status === 200 && res10.text.includes('Already processed') ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 3 & 4: Failed Payment Webhook & Duplicate Failed Webhook
  // -------------------------------------------------------------------------
  const failedTxnId = `HB_FAIL_${Date.now()}`;
  const bookingFailed = await Booking.create({
    property: property._id,
    guest: user._id,
    host: host._id,
    room: room._id,
    checkIn: new Date('2026-11-20'),
    checkOut: new Date('2026-11-22'),
    nights: 2,
    guests: 1,
    roomCount: 1,
    pricePerNight: 5000,
    subtotal: 10000,
    serviceFee: 1000,
    taxes: 1800,
    totalAmount: 12800,
    status: 'pending',
    paymentStatus: 'UNPAID',
    currency: 'INR',
  });

  const paymentFailed = await Payment.create({
    orderId: failedTxnId,
    booking: bookingFailed._id,
    user: user._id,
    amount: 12800,
    currency: 'INR',
    status: 'pending',
    gateway: 'payu',
  });

  const failedPayload = {
    txnid: failedTxnId,
    amount: '12800',
    productinfo: 'Hopebed Sea View Villa',
    firstname: user.name,
    email: user.email,
    status: 'failure',
    hash: generatePayUHash({
      key,
      salt,
      txnid: failedTxnId,
      amount: '12800',
      productinfo: 'Hopebed Sea View Villa',
      firstname: user.name,
      email: user.email,
      status: 'failure',
    }),
  };

  console.log('--- TEST 3: First Valid Failed Webhook ---');
  const res3 = await postWebhook(failedPayload);
  const updatedPaymentFailed3 = await Payment.findById(paymentFailed._id);
  const updatedBookingFailed3 = await Booking.findById(bookingFailed._id);
  console.log(`Status: ${res3.status}, Body: "${res3.text}"`);
  console.log(`Payment Status: ${updatedPaymentFailed3?.status}, Booking Status: ${updatedBookingFailed3?.status}`);
  console.log(`Result: ${res3.status === 200 && updatedPaymentFailed3?.status === 'failed' && updatedBookingFailed3?.paymentStatus === 'UNPAID' ? 'PASS ✅' : 'FAIL ❌'}\n`);

  console.log('--- TEST 4: Duplicate Failed Webhook ---');
  const res4 = await postWebhook(failedPayload);
  console.log(`Status: ${res4.status}, Body: "${res4.text}"`);
  console.log(`Result: ${res4.status === 200 && res4.text.includes('Already processed') ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // TEST 9 & CONCURRENCY: Simultaneous Duplicate Webhooks for a New Booking
  // -------------------------------------------------------------------------
  console.log('--- TEST 9: Concurrent Duplicate Webhook Test ---');
  const concurrentTxnId = `HB_CONCUR_${Date.now()}`;
  const bookingConcur = await Booking.create({
    property: property._id,
    guest: user._id,
    host: host._id,
    room: room._id,
    checkIn: new Date('2026-11-10'),
    checkOut: new Date('2026-11-12'),
    nights: 2,
    guests: 1,
    roomCount: 1,
    pricePerNight: 5000,
    subtotal: 10000,
    serviceFee: 1000,
    taxes: 1800,
    totalAmount: 12800,
    status: 'pending',
    paymentStatus: 'UNPAID',
    currency: 'INR',
  });

  const paymentConcur = await Payment.create({
    orderId: concurrentTxnId,
    booking: bookingConcur._id,
    user: user._id,
    amount: 12800,
    currency: 'INR',
    status: 'pending',
    gateway: 'payu',
  });

  const concurPayload = {
    txnid: concurrentTxnId,
    amount: '12800',
    productinfo: 'Hopebed Sea View Villa',
    firstname: user.name,
    email: user.email,
    status: 'success',
    hash: generatePayUHash({
      key,
      salt,
      txnid: concurrentTxnId,
      amount: '12800',
      productinfo: 'Hopebed Sea View Villa',
      firstname: user.name,
      email: user.email,
      status: 'success',
    }),
  };

  // Fire 2 webhooks simultaneously
  const [concurRes1, concurRes2] = await Promise.all([
    postWebhook(concurPayload),
    postWebhook(concurPayload),
  ]);

  console.log(`Concurrent Response 1: HTTP ${concurRes1.status} ("${concurRes1.text}")`);
  console.log(`Concurrent Response 2: HTTP ${concurRes2.status} ("${concurRes2.text}")`);

  const concurResults = [concurRes1.text, concurRes2.text];
  const hasProcessed = concurResults.includes('Webhook processed');
  const hasAlreadyProcessed = concurResults.includes('Already processed');

  console.log(`Result: ${hasProcessed && hasAlreadyProcessed ? 'PASS ✅ (Exactly 1 processed, 1 blocked as Already Processed)' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // MONGODB INTEGRITY AUDIT
  // -------------------------------------------------------------------------
  console.log('--- MONGODB DATABASE STATE AUDIT ---');
  const paymentCount1 = await Payment.countDocuments({ orderId: txnid });
  const paymentCount2 = await Payment.countDocuments({ orderId: concurrentTxnId });

  console.log(`Payment Record Count for ${txnid}: ${paymentCount1} (Expected: 1)`);
  console.log(`Payment Record Count for ${concurrentTxnId}: ${paymentCount2} (Expected: 1)`);

  await mongoose.disconnect();
  console.log('\n=== PAYU IDEMPOTENCY TEST SUITE COMPLETED SUCCESSFULLY ===');
}

runIdempotencyTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
