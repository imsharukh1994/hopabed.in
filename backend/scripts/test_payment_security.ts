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
import jwt from 'jsonwebtoken';

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

function generateAuthToken(userId: string) {
  return jwt.sign({ role: 'guest' }, env.JWT_SECRET, { subject: userId, expiresIn: '1d' });
}

async function runPaymentSecurityTests() {
  console.log('=== STARTING PAYMENT SECURITY & AMOUNT MISMATCH TESTS ===\n');

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log('Connected to MongoDB.\n');

  const testEmail = `security_test_${Date.now()}@example.com`;
  const user = await User.create({
    name: 'Security Test User',
    email: testEmail,
    passwordHash: 'hashed_password_123',
    role: 'guest',
  });
  const token = generateAuthToken(user._id.toString());

  const hostUser = await User.create({
    name: 'Security Test Host',
    email: `host_sec_${Date.now()}@example.com`,
    passwordHash: 'hashed_password_123',
    role: 'host',
  });

  const host = await Host.create({
    user: hostUser._id,
    businessName: 'Security Test Stays',
    verificationStatus: 'verified',
  });

  const property = await Property.create({
    host: host._id,
    title: 'Security Test Property',
    slug: `sec-test-${Date.now()}`,
    propertyType: 'apartment',
    category: 'stay',
    city: 'Pune',
    locality: 'Koregaon Park',
    state: 'Maharashtra',
    country: 'India',
    address: '456 Security Avenue',
    location: { type: 'Point', coordinates: [73.85, 18.52] },
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 999,
    currency: 'INR',
    description: 'Test Property for Security Handling',
    amenities: ['wifi'],
    houseRules: [],
    isVerified: true,
    isPublished: true,
    verificationStatus: 'VERIFIED',
  });

  const room = await Room.create({
    property: property._id,
    name: 'Standard Room',
    roomType: 'private',
    capacity: 2,
    inventory: 3,
    pricePerNight: 999,
    currency: 'INR',
    amenities: ['wifi'],
    isActive: true,
  });

  const key = env.PAYU_MERCHANT_KEY;
  const salt = env.PAYU_MERCHANT_SALT;
  const API_URL = env.API_URL;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // -------------------------------------------------------------------------
  // 4. TEST BOOKING TOTAL TAMPERING
  // -------------------------------------------------------------------------
  console.log('--- 4. Testing Booking Total Tampering ---');
  const bookingTamperPayload = {
    roomId: room._id.toString(),
    checkIn: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    checkOut: new Date(Date.now() + 86400000 * 4).toISOString(), // +3 days
    guests: 1,
    roomCount: 1,
    subtotal: 10,
    serviceFee: 0,
    taxes: 0,
    totalAmount: 10
  };
  
  const resBooking = await fetch(`${API_URL}/api/properties/${property._id}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bookingTamperPayload)
  });
  
  const bookingData = await resBooking.json() as any;
  if (!bookingData.success) {
      throw new Error(`Booking creation failed: ${JSON.stringify(bookingData)}`);
  }
  const createdBooking = bookingData.data.booking;
  const expectedTotal = Math.round(999 * 3) + Math.round(Math.round(999 * 3) * 0.05) + Math.round((Math.round(999 * 3) + Math.round(Math.round(999 * 3) * 0.05)) * 0.05);
  // Subtotal = 2997
  // Service Fee = Math.round(2997 * 0.05) = 150
  // Taxes = Math.round((2997 + 150) * 0.05) = 157
  // Expected Total = 2997 + 150 + 157 = 3304
  const expectedTotalAmount = 3304;

  console.log(`Tampered Input: subtotal=10, totalAmount=10`);
  console.log(`Server Authoritative Amount: ${createdBooking.totalAmount} (Expected: ${expectedTotalAmount})`);
  console.log(`Result: ${createdBooking.totalAmount === expectedTotalAmount ? 'PASS ✅' : 'FAIL ❌'}\n`);

  const bookingId = createdBooking._id;

  // -------------------------------------------------------------------------
  // 3. TEST CLIENT AMOUNT TAMPERING (INIT)
  // -------------------------------------------------------------------------
  console.log('--- 3. Testing Client Amount Tampering on PayU Init ---');
  const tamperedAmounts = [10, 1, 999, 3000, 5000, -100, 0, "5000"];
  let initPassed = true;
  let finalTxnId = '';
  
  for (const tamperedAmount of tamperedAmounts) {
    const resInit = await fetch(`${API_URL}/api/payments/payu-init`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bookingId, amount: tamperedAmount })
    });
    const initData = await resInit.json() as any;
    if (initData.data.amount !== expectedTotalAmount.toFixed(2)) {
      initPassed = false;
      console.log(`Failed for tampered amount ${tamperedAmount}. Got: ${initData.data.amount}`);
    }
    finalTxnId = initData.data.txnid;
  }
  
  console.log(`Server generated PayU amount ignores all client tampering.`);
  console.log(`Result: ${initPassed ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 5. TEST CALLBACK AMOUNT MISMATCH
  // -------------------------------------------------------------------------
  console.log('--- 5. Testing Callback Amount Mismatch ---');
  const callbackTamperAmounts = ['10.00', '3000.00', '5000.00', '0.00', '-50.00', 'invalid'];
  let callbackMismatchesRejected = true;

  for (const cbAmount of callbackTamperAmounts) {
    const mismatchPayload = {
      txnid: finalTxnId,
      amount: cbAmount,
      productinfo: `Booking ${bookingId}`,
      firstname: user.name.split(' ')[0],
      email: user.email,
      status: 'success',
      hash: generatePayUHash({
        key,
        salt,
        txnid: finalTxnId,
        amount: cbAmount,
        productinfo: `Booking ${bookingId}`,
        firstname: user.name.split(' ')[0],
        email: user.email,
        status: 'success',
      }),
    };
    
    const resWebhook = await fetch(`${API_URL}/api/payments/payu-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mismatchPayload)
    });
    
    if (resWebhook.status !== 400) {
      callbackMismatchesRejected = false;
      console.log(`Failed to reject callback mismatch for amount ${cbAmount}. Status: ${resWebhook.status}`);
    }
  }

  // Verify Booking remains unpaid
  const bookingAfterMismatch = await Booking.findById(bookingId);
  const paymentAfterMismatch = await Payment.findOne({ orderId: finalTxnId });
  
  console.log(`Booking Status after mismatched callbacks: ${bookingAfterMismatch?.status} (Expected: pending)`);
  console.log(`Payment Status after mismatched callbacks: ${paymentAfterMismatch?.status} (Expected: pending)`);
  
  const callbackPass = callbackMismatchesRejected && bookingAfterMismatch?.status === 'pending' && paymentAfterMismatch?.status === 'pending';
  console.log(`Result: ${callbackPass ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // VALID CALLBACK TO TEST DUPLICATE / IDEMPOTENCY
  // -------------------------------------------------------------------------
  console.log('--- 7. Testing Valid Payment and Duplicate Callback (Idempotency) ---');
  
  const validAmount = expectedTotalAmount.toFixed(2);
  const validPayload = {
    txnid: finalTxnId,
    amount: validAmount,
    productinfo: `Booking ${bookingId}`,
    firstname: user.name.split(' ')[0],
    email: user.email,
    status: 'success',
    hash: generatePayUHash({
      key,
      salt,
      txnid: finalTxnId,
      amount: validAmount,
      productinfo: `Booking ${bookingId}`,
      firstname: user.name.split(' ')[0],
      email: user.email,
      status: 'success',
    }),
  };

  const resValid1 = await fetch(`${API_URL}/api/payments/payu-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });

  const resValid2 = await fetch(`${API_URL}/api/payments/payu-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });

  const bookingAfterValid = await Booking.findById(bookingId);
  const paymentAfterValid = await Payment.findOne({ orderId: finalTxnId });
  const paymentRecordCount = await Payment.countDocuments({ booking: bookingId });

  console.log(`First Valid Webhook HTTP Status: ${resValid1.status} (Expected: 200)`);
  console.log(`Second Valid Webhook HTTP Status: ${resValid2.status} (Expected: 200 "Already processed")`);
  
  console.log(`Final Booking Status: ${bookingAfterValid?.status} (Expected: confirmed)`);
  console.log(`Final Payment Status: ${paymentAfterValid?.status} (Expected: captured)`);
  console.log(`Payment Records Count for Booking: ${paymentRecordCount} (Expected: 1)`);

  const duplicatePass = 
    resValid1.status === 200 &&
    resValid2.status === 200 && 
    (await resValid2.text()).includes('Already processed') &&
    bookingAfterValid?.status === 'confirmed' &&
    paymentRecordCount === 1;
    
  console.log(`Result: ${duplicatePass ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // -------------------------------------------------------------------------
  // 6. UNAUTHORIZED USER ATTEMPTS TO INITIALIZE PAYMENT
  // -------------------------------------------------------------------------
  console.log('--- 6. Testing Unauthorized User Payment Init ---');
  const otherUser = await User.create({
    name: 'Unauthorized User',
    email: `unauth_${Date.now()}@example.com`,
    passwordHash: 'hashed_password_123',
    role: 'guest',
  });
  const unauthHeader = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${generateAuthToken(otherUser._id.toString())}`,
  };

  const resUnauthInit = await fetch(`${API_URL}/api/payments/payu-init`, {
    method: 'POST',
    headers: unauthHeader,
    body: JSON.stringify({ bookingId })
  });

  console.log(`Unauthorized Init HTTP Status: ${resUnauthInit.status} (Expected: 404 - Not found for user)`);
  const unauthPass = resUnauthInit.status === 404;
  console.log(`Result: ${unauthPass ? 'PASS ✅' : 'FAIL ❌'}\n`);


  // Cleanup test documents
  await Booking.deleteOne({ _id: bookingId });
  await Payment.deleteMany({ booking: bookingId });
  await Room.deleteOne({ _id: room._id });
  await Property.deleteOne({ _id: property._id });
  await Host.deleteOne({ _id: host._id });
  await User.deleteMany({ _id: { $in: [user._id, hostUser._id, otherUser._id] } });

  await mongoose.disconnect();
  console.log('=== PAYMENT SECURITY TEST SUITE COMPLETED ===');
}

runPaymentSecurityTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
