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
  const reverseHashString = `${params.salt}|${params.status}|||||||||||${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${params.key}`;
  return sha512(reverseHashString);
}

async function runPaymentFailureTests() {
  console.log('=== STARTING PAYU PAYMENT FAILURE HANDLING TEST SUITE ===\n');

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log('Connected to MongoDB.');

  const testEmail = `failure_test_${Date.now()}@example.com`;
  const user = await User.create({
    name: 'Failure Test User',
    email: testEmail,
    passwordHash: 'hashed_password_123',
    role: 'guest',
  });

  const hostUser = await User.create({
    name: 'Failure Test Host',
    email: `host_fail_${Date.now()}@example.com`,
    passwordHash: 'hashed_password_123',
    role: 'host',
  });

  const host = await Host.create({
    user: hostUser._id,
    businessName: 'Failure Test Stays',
    verificationStatus: 'verified',
  });

  const property = await Property.create({
    host: host._id,
    title: 'Failure Test Property',
    slug: `fail-test-${Date.now()}`,
    propertyType: 'apartment',
    category: 'stay',
    city: 'Pune',
    locality: 'Koregaon Park',
    state: 'Maharashtra',
    country: 'India',
    address: '456 Park Avenue',
    location: { type: 'Point', coordinates: [73.85, 18.52] },
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 3000,
    currency: 'INR',
    description: 'Test Property for Failure Handling',
    amenities: ['wifi'],
    houseRules: [],
    isVerified: true,
    isPublished: true,
    verificationStatus: 'VERIFIED',
  });

  const room = await Room.create({
    property: property._id,
    name: 'Studio Apartment',
    roomType: 'private',
    capacity: 2,
    inventory: 3,
    pricePerNight: 3000,
    currency: 'INR',
    amenities: ['wifi'],
    isActive: true,
  });

  const booking = await Booking.create({
    property: property._id,
    guest: user._id,
    host: host._id,
    room: room._id,
    checkIn: new Date('2026-11-15'),
    checkOut: new Date('2026-11-18'),
    nights: 3,
    guests: 2,
    roomCount: 1,
    pricePerNight: 3000,
    subtotal: 9000,
    serviceFee: 900,
    taxes: 1620,
    totalAmount: 11520,
    status: 'pending',
    paymentStatus: 'UNPAID',
    currency: 'INR',
  });

  const txnidFailed = `HB_FAIL_TXN_${Date.now()}`;
  const paymentFailed = await Payment.create({
    orderId: txnidFailed,
    booking: booking._id,
    user: user._id,
    amount: 11520,
    currency: 'INR',
    status: 'pending',
    paymentGateway: 'payu',
  });

  console.log(`Created Initial Booking ID: ${booking._id} (status: ${booking.status}, paymentStatus: ${booking.paymentStatus})`);
  console.log(`Created Initial Payment TXN ID: ${txnidFailed} (status: ${paymentFailed.status})\n`);

  const key = env.PAYU_MERCHANT_KEY;
  const salt = env.PAYU_MERCHANT_SALT;
  const API_URL = env.API_URL;

  async function postWebhook(payload: any) {
    const res = await fetch(`${API_URL}/api/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return { status: res.status, text };
  }

  const failedPayload = {
    txnid: txnidFailed,
    amount: '11520',
    productinfo: 'Failure Test Property',
    firstname: user.name,
    email: user.email,
    status: 'failure',
    hash: generatePayUHash({
      key,
      salt,
      txnid: txnidFailed,
      amount: '11520',
      productinfo: 'Failure Test Property',
      firstname: user.name,
      email: user.email,
      status: 'failure',
    }),
  };

  // -------------------------------------------------------------------------
  // 1. SECURITY NEGATIVE TESTS (BEFORE VALID PROCCESSING)
  // -------------------------------------------------------------------------
  console.log('--- 1. Security Negative Tests ---');

  // TEST 1 — Invalid signature
  const badHashPayload = { ...failedPayload, hash: 'invalid_hash_signature_123456789' };
  const resBadHash = await postWebhook(badHashPayload);
  console.log(`Test 1 (Invalid Hash): HTTP ${resBadHash.status} ("${resBadHash.text}") -> ${resBadHash.status === 400 ? 'PASS ✅' : 'FAIL ❌'}`);

  // TEST 2 — Tampered amount
  const tamperedAmountPayload = {
    ...failedPayload,
    amount: '100', // Tampered amount
    hash: generatePayUHash({
      key,
      salt,
      txnid: txnidFailed,
      amount: '100',
      productinfo: 'Failure Test Property',
      firstname: user.name,
      email: user.email,
      status: 'failure',
    }),
  };
  const resTampered = await postWebhook(tamperedAmountPayload);
  console.log(`Test 2 (Tampered Amount): HTTP ${resTampered.status} ("${resTampered.text}") -> ${resTampered.status === 400 ? 'PASS ✅' : 'FAIL ❌'}`);

  // TEST 3 — Unknown transaction ID
  const unknownTxnid = `UNKNOWN_TXN_${Date.now()}`;
  const unknownTxnPayload = {
    txnid: unknownTxnid,
    amount: '11520',
    productinfo: 'Failure Test Property',
    firstname: user.name,
    email: user.email,
    status: 'failure',
    hash: generatePayUHash({
      key,
      salt,
      txnid: unknownTxnid,
      amount: '11520',
      productinfo: 'Failure Test Property',
      firstname: user.name,
      email: user.email,
      status: 'failure',
    }),
  };
  const resUnknown = await postWebhook(unknownTxnPayload);
  console.log(`Test 3 (Unknown TXN ID): HTTP ${resUnknown.status} ("${resUnknown.text}") -> ${resUnknown.status === 404 ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 2. FAILED PAYMENT WEBHOOK TEST
  // -------------------------------------------------------------------------
  console.log('--- 2. Processing Valid Failed PayU Webhook ---');
  const res1 = await postWebhook(failedPayload);
  console.log(`Webhook Response: HTTP ${res1.status} ("${res1.text}")`);

  const paymentAfterFail = await Payment.findById(paymentFailed._id);
  const bookingAfterFail = await Booking.findById(booking._id);

  console.log(`Payment Status after Failure Webhook: ${paymentAfterFail?.status} (Expected: failed)`);
  console.log(`Booking Status after Failure Webhook: ${bookingAfterFail?.status} (Expected: pending)`);
  console.log(`Booking Payment Status: ${bookingAfterFail?.paymentStatus} (Expected: UNPAID)`);

  const isFailVerified =
    paymentAfterFail?.status === 'failed' &&
    bookingAfterFail?.status === 'pending' &&
    bookingAfterFail?.paymentStatus === 'UNPAID';

  console.log(`Result: ${isFailVerified ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 3. DUPLICATE FAILED WEBHOOK TEST
  // -------------------------------------------------------------------------
  console.log('--- 3. Duplicate Failed Webhook Test ---');
  const resDupFail = await postWebhook(failedPayload);
  console.log(`Duplicate Response: HTTP ${resDupFail.status} ("${resDupFail.text}")`);
  const isDupHandled = resDupFail.status === 200 && resDupFail.text.includes('Already processed');
  console.log(`Result: ${isDupHandled ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 4. FAILURE REDIRECT API TEST (POST /api/payments/payu-failure)
  // -------------------------------------------------------------------------
  console.log('--- 4. Testing PayU Failure Callback Redirect Endpoint ---');
  const resRedirect = await fetch(`${API_URL}/api/payments/payu-failure`, {
    method: 'POST',
    redirect: 'manual',
  });
  const redirectLocation = resRedirect.headers.get('location');
  console.log(`Redirect HTTP Status: ${resRedirect.status}, Location: "${redirectLocation}"`);

  const bookingAfterRedirect = await Booking.findById(booking._id);
  const isRedirectSafe =
    resRedirect.status === 302 &&
    redirectLocation?.includes('error=payment_failed') &&
    bookingAfterRedirect?.status === 'pending' &&
    bookingAfterRedirect?.paymentStatus === 'UNPAID';

  console.log(`Result: ${isRedirectSafe ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 5. DATABASE VERIFICATION (AFTER INITIAL FAILURE)
  // -------------------------------------------------------------------------
  console.log('--- 5. Database Verification (After Initial Failure) ---');
  const paymentDocsAfterFail = await Payment.find({ booking: booking._id });
  const bookingDocsAfterFail = await Booking.find({ _id: booking._id });

  console.log(`Payment Record Count: ${paymentDocsAfterFail.length} (Expected: 1)`);
  console.log(`Payment Status: ${paymentDocsAfterFail[0]?.status} (Expected: failed)`);
  console.log(`Booking Status: ${bookingDocsAfterFail[0]?.status} (Expected: pending)`);
  console.log(`Booking PaymentStatus: ${bookingDocsAfterFail[0]?.paymentStatus} (Expected: UNPAID)`);

  const isDbVerificationPassed =
    paymentDocsAfterFail.length === 1 &&
    paymentDocsAfterFail[0].status === 'failed' &&
    bookingDocsAfterFail.length === 1 &&
    bookingDocsAfterFail[0].status === 'pending' &&
    bookingDocsAfterFail[0].paymentStatus === 'UNPAID';
  console.log(`Result: ${isDbVerificationPassed ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 6. RETRY PAYMENT AFTER FAILURE TEST
  // -------------------------------------------------------------------------
  console.log('--- 6. Payment Retry Flow Test ---');
  const txnidRetry = `HB_RETRY_TXN_${Date.now()}`;
  const paymentRetry = await Payment.findOneAndUpdate(
    { booking: booking._id },
    {
      $set: {
        orderId: txnidRetry,
        user: user._id,
        amount: 11520,
        currency: 'INR',
        status: 'pending',
        paymentGateway: 'payu',
      },
    },
    { upsert: true, new: true }
  );

  console.log(`Updated Payment TXN ID to Retry ID: ${txnidRetry} (status: ${paymentRetry?.status})`);

  const retrySuccessPayload = {
    txnid: txnidRetry,
    amount: '11520',
    productinfo: 'Failure Test Property',
    firstname: user.name,
    email: user.email,
    status: 'success',
    hash: generatePayUHash({
      key,
      salt,
      txnid: txnidRetry,
      amount: '11520',
      productinfo: 'Failure Test Property',
      firstname: user.name,
      email: user.email,
      status: 'success',
    }),
  };

  const resRetrySuccess = await postWebhook(retrySuccessPayload);
  console.log(`Retry Webhook Response: HTTP ${resRetrySuccess.status} ("${resRetrySuccess.text}")`);

  const paymentAfterRetry = await Payment.findById(paymentRetry?._id);
  const bookingAfterRetry = await Booking.findById(booking._id);

  console.log(`Retry Payment Status: ${paymentAfterRetry?.status} (Expected: captured)`);
  console.log(`Booking Status after Retry Success: ${bookingAfterRetry?.status} (Expected: confirmed)`);
  console.log(`Booking Payment Status: ${bookingAfterRetry?.paymentStatus} (Expected: PAID)`);

  const isRetrySuccessVerified =
    paymentAfterRetry?.status === 'captured' &&
    bookingAfterRetry?.status === 'confirmed' &&
    bookingAfterRetry?.paymentStatus === 'PAID';

  console.log(`Result: ${isRetrySuccessVerified ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 7. CAPTURED -> FAILED SPOOF PROTECTION TEST
  // -------------------------------------------------------------------------
  console.log('--- 7. Testing Captured -> Failed Spoof Protection ---');
  const spoofFailPayload = {
    txnid: txnidRetry,
    amount: '11520',
    productinfo: 'Failure Test Property',
    firstname: user.name,
    email: user.email,
    status: 'failure',
    hash: generatePayUHash({
      key,
      salt,
      txnid: txnidRetry,
      amount: '11520',
      productinfo: 'Failure Test Property',
      firstname: user.name,
      email: user.email,
      status: 'failure',
    }),
  };

  const resSpoofFail = await postWebhook(spoofFailPayload);
  console.log(`Spoof Fail Response: HTTP ${resSpoofFail.status} ("${resSpoofFail.text}")`);

  const paymentAfterSpoof = await Payment.findById(paymentRetry?._id);
  const bookingAfterSpoof = await Booking.findById(booking._id);

  console.log(`Payment Status after Spoof Attempt: ${paymentAfterSpoof?.status} (Expected: captured)`);
  console.log(`Booking Status after Spoof Attempt: ${bookingAfterSpoof?.status} (Expected: confirmed)`);

  const isSpoofProtected =
    resSpoofFail.status === 200 &&
    resSpoofFail.text.includes('Already processed') &&
    paymentAfterSpoof?.status === 'captured' &&
    bookingAfterSpoof?.status === 'confirmed';

  console.log(`Result: ${isSpoofProtected ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // Cleanup test documents
  await Booking.deleteOne({ _id: booking._id });
  await Payment.deleteOne({ _id: paymentFailed._id });
  await Room.deleteOne({ _id: room._id });
  await Property.deleteOne({ _id: property._id });
  await Host.deleteOne({ _id: host._id });
  await User.deleteMany({ _id: { $in: [user._id, hostUser._id] } });

  await mongoose.disconnect();
  console.log('=== PAYU PAYMENT FAILURE HANDLING TEST SUITE COMPLETED SUCCESSFULLY ===');
}

runPaymentFailureTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
