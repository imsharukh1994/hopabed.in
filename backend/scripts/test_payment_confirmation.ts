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

async function runConfirmationTests() {
  console.log('=== STARTING BOOKING CONFIRMATION TESTS ===\n');

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log('Connected to MongoDB.\n');

  const user = await User.create({
    name: 'Confirm Test User',
    email: `confirm_test_${Date.now()}@example.com`,
    passwordHash: 'hashed_password_123',
    role: 'guest',
  });
  const token = generateAuthToken(user._id.toString());
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const hostUser = await User.create({
    name: 'Confirm Test Host',
    email: `host_conf_${Date.now()}@example.com`,
    passwordHash: 'hashed_password_123',
    role: 'host',
  });

  const host = await Host.create({ user: hostUser._id, businessName: 'Confirm Stays', verificationStatus: 'verified' });

  const property = await Property.create({
    host: host._id, title: 'Confirm Test Property', slug: `conf-test-${Date.now()}`,
    propertyType: 'apartment', category: 'stay', city: 'Pune', locality: 'Koregaon Park',
    state: 'Maharashtra', country: 'India', address: '123 Confirm St',
    location: { type: 'Point', coordinates: [73.85, 18.52] },
    bedrooms: 1, bathrooms: 1, maxGuests: 2, pricePerNight: 1000, currency: 'INR',
    description: 'Test Property for Confirmation', amenities: ['wifi'], houseRules: [],
    isVerified: true, isPublished: true, verificationStatus: 'VERIFIED',
  });

  const room = await Room.create({
    property: property._id, name: 'Standard Room', roomType: 'private',
    capacity: 2, inventory: 3, pricePerNight: 1000, currency: 'INR', amenities: ['wifi'], isActive: true,
  });

  const API_URL = env.API_URL;
  const key = env.PAYU_MERCHANT_KEY;
  const salt = env.PAYU_MERCHANT_SALT;

  // 1 & 2 & 3. Create Booking & Client-Side Manipulation Test
  console.log('--- 3. Testing Client-Side Success Manipulation ---');
  const bookingPayload = {
    roomId: room._id.toString(),
    checkIn: new Date(Date.now() + 86400000).toISOString(),
    checkOut: new Date(Date.now() + 86400000 * 3).toISOString(),
    guests: 1, roomCount: 1,
    status: 'confirmed', // Tampering
    paymentStatus: 'PAID' // Tampering
  };
  
  const resBooking = await fetch(`${API_URL}/api/properties/${property._id}/bookings`, {
    method: 'POST', headers, body: JSON.stringify(bookingPayload)
  });
  
  const bookingData = await resBooking.json() as any;
  const booking = bookingData.data.booking;
  const expectedTotal = 2205; // (1000*2) = 2000 subtotal -> 2000 * 1.05 * 1.05
  
  console.log(`Tampered Input: status="confirmed", paymentStatus="PAID"`);
  console.log(`Server Booking Status: ${booking.status} (Expected: pending)`);
  console.log(`Server Payment Status: ${booking.paymentStatus} (Expected: UNPAID)`);
  console.log(`Result: ${booking.status === 'pending' && booking.paymentStatus === 'UNPAID' ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // Init Payment
  const resInit = await fetch(`${API_URL}/api/payments/payu-init`, {
    method: 'POST', headers, body: JSON.stringify({ bookingId: booking._id })
  });
  const initData = await resInit.json() as any;
  const txnid = initData.data.txnid;
  const amountStr = initData.data.amount;

  // 4. Test Success Page Without Verified Payment
  console.log('--- 4. Testing Success Page Without Verified Payment ---');
  const resSuccessPage = await fetch(`${API_URL}/api/payments/payu-success`, {
    method: 'POST', redirect: 'manual'
  });
  console.log(`Frontend Success Page HTTP Status: ${resSuccessPage.status} (Expected: 302 Redirect)`);
  const bookingAfterSuccessPage = await Booking.findById(booking._id);
  console.log(`Booking Status after visiting success page: ${bookingAfterSuccessPage?.status} (Expected: pending)`);
  console.log(`Result: ${bookingAfterSuccessPage?.status === 'pending' ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // 7. Test PayU Pending Webhook
  console.log('--- 7. Testing PayU Pending Response ---');
  const pendingPayload = {
    txnid, amount: amountStr, productinfo: `Booking ${booking._id}`,
    firstname: user.name.split(' ')[0], email: user.email, status: 'pending',
    hash: generatePayUHash({
      key, salt, txnid, amount: amountStr, productinfo: `Booking ${booking._id}`,
      firstname: user.name.split(' ')[0], email: user.email, status: 'pending',
    }),
  };
  const resPendingWebhook = await fetch(`${API_URL}/api/payments/payu-webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingPayload)
  });
  console.log(`Pending Webhook Response Status: ${resPendingWebhook.status}`);
  const paymentAfterPending = await Payment.findOne({ orderId: txnid });
  const bookingAfterPending = await Booking.findById(booking._id);
  console.log(`Payment Status: ${paymentAfterPending?.status} (Expected: pending)`);
  console.log(`Booking Status: ${bookingAfterPending?.status} (Expected: pending)`);
  console.log(`Result: ${paymentAfterPending?.status === 'pending' ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // 10. Test Callback for Wrong Booking
  console.log('--- 10. Testing Callback for Wrong Booking ---');
  const wrongTxnid = 'HB_WRONG_12345';
  const wrongBookingPayload = {
    txnid: wrongTxnid, amount: amountStr, productinfo: `Booking ${booking._id}`,
    firstname: user.name.split(' ')[0], email: user.email, status: 'success',
    hash: generatePayUHash({
      key, salt, txnid: wrongTxnid, amount: amountStr, productinfo: `Booking ${booking._id}`,
      firstname: user.name.split(' ')[0], email: user.email, status: 'success',
    }),
  };
  const resWrongWebhook = await fetch(`${API_URL}/api/payments/payu-webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(wrongBookingPayload)
  });
  console.log(`Wrong Booking Webhook Response Status: ${resWrongWebhook.status} (Expected: 404)`);
  const bookingAfterWrong = await Booking.findById(booking._id);
  console.log(`Original Booking Status: ${bookingAfterWrong?.status} (Expected: pending)`);
  console.log(`Result: ${resWrongWebhook.status === 404 && bookingAfterWrong?.status === 'pending' ? 'PASS ✅' : 'FAIL ❌'}\n`);


  // 15. Test Direct API Manipulation
  console.log('--- 15. Testing Direct API Manipulation ---');
  const resDirectApi = await fetch(`${API_URL}/api/bookings/${booking._id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ status: 'confirmed' })
  });
  console.log(`Direct API Update Status: ${resDirectApi.status} (Expected: 404 or 405 - No endpoint exists)`);
  console.log(`Result: ${resDirectApi.status >= 400 ? 'PASS ✅' : 'FAIL ❌'}\n`);


  // 5. Test Verified PayU Success
  console.log('--- 5. Testing Verified PayU Success ---');
  const successPayload = {
    txnid, amount: amountStr, productinfo: `Booking ${booking._id}`,
    firstname: user.name.split(' ')[0], email: user.email, status: 'success',
    hash: generatePayUHash({
      key, salt, txnid, amount: amountStr, productinfo: `Booking ${booking._id}`,
      firstname: user.name.split(' ')[0], email: user.email, status: 'success',
    }),
  };
  const resSuccessWebhook = await fetch(`${API_URL}/api/payments/payu-webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(successPayload)
  });
  console.log(`Success Webhook Response Status: ${resSuccessWebhook.status}`);
  const paymentAfterSuccess = await Payment.findOne({ orderId: txnid });
  const bookingAfterSuccess = await Booking.findById(booking._id);
  console.log(`Payment Status: ${paymentAfterSuccess?.status} (Expected: captured)`);
  console.log(`Booking Status: ${bookingAfterSuccess?.status} (Expected: confirmed)`);
  console.log(`Stay Pass URL relies on confirmed status.`);
  console.log(`Result: ${paymentAfterSuccess?.status === 'captured' && bookingAfterSuccess?.status === 'confirmed' ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // Cleanup
  await Booking.deleteOne({ _id: booking._id });
  await Payment.deleteMany({ booking: booking._id });
  await Room.deleteOne({ _id: room._id });
  await Property.deleteOne({ _id: property._id });
  await Host.deleteOne({ _id: host._id });
  await User.deleteMany({ _id: { $in: [user._id, hostUser._id] } });

  await mongoose.disconnect();
  console.log('=== BOOKING CONFIRMATION TEST SUITE COMPLETED ===');
}

runConfirmationTests().catch(err => {
  console.error(err);
  process.exit(1);
});
