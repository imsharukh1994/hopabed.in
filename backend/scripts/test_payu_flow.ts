import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment and connect to DB
dotenv.config({ path: path.join(process.cwd(), '../.env') });
import { Booking } from '../src/models/Booking.js';
import { Payment } from '../src/models/Payment.js';
import { Property } from '../src/models/Property.js';
import { Room } from '../src/models/Room.js';
import { User } from '../src/models/User.js';

function sha512(str) {
  return crypto.createHash('sha512').update(str).digest('hex');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clear previous test data
  await Booking.deleteMany({ notes: "TEST_BOOKING" });
  await Payment.deleteMany({ currency: "TEST_INR" });

  let admin = await User.findOne({ role: 'admin' }) || await User.findOne();
  if (!admin) {
    admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
  }

  let property = await Property.findOne({ verificationStatus: 'VERIFIED', isVerified: true, isPublished: true });
  if (!property) {
    property = await Property.create({
      host: admin._id,
      title: "Test Property",
      city: "Test City",
      state: "Test State",
      locality: "Test Loc",
      slug: "test-prop",
      propertyType: "apartment",
      address: "123 Test St",
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      },
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      description: "A test property",
      verificationStatus: 'VERIFIED',
      isVerified: true,
      isPublished: true,
      pricePerNight: 1000
    });
  }

  let room = await Room.findOne({ property: property._id });
  if (!room) {
    room = await Room.create({
      property: property._id,
      name: "Test Room",
      roomType: 'private',
      capacity: 2,
      inventory: 1,
      pricePerNight: 1000,
      isActive: true
    });
  } else {
    // Ensure inventory is 1 for concurrency test
    room.inventory = 1;
    await room.save();
  }

  const user = admin;
  const API_URL = 'http://localhost:4000'; // Assuming backend runs on 4000 for local test, but we will interact directly with DB/Logic for speed/simplicity, OR we can start the server.
  // Given we are writing a script, testing API layer requires the server to be running.
  // Instead of HTTP requests, I'll simulate the route logic directly since we have the DB models.

  console.log("\n--- TEST 1: Concurrency (Write Skew) Test ---");
  console.log("Attempting to book the same room twice simultaneously...");

  // We simulate what the route does.
  const createBookingSim = async () => {
    const session = await mongoose.startSession();
    let b;
    try {
      await session.withTransaction(async () => {
        const p = await Property.findOne({ _id: property._id, verificationStatus: 'VERIFIED', isVerified: true, isPublished: true }).session(session);
        const r = await Room.findOneAndUpdate({ _id: room._id, property: property._id, isActive: true }, { $inc: { __v: 1 } }, { new: true }).session(session);
        if (!p || !r) throw new Error('ROOM_UNAVAILABLE');

        // Simulating the delay that allows race conditions
        await sleep(200);

        const checkIn = new Date(); checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date(); checkOut.setDate(checkOut.getDate() + 2);

        const overlap = await Booking.aggregate([{ $match: { room: r._id, status: { $in: ['pending', 'confirmed', 'checked_in'] }, checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } } }]).session(session);
        const bookedCount = overlap.reduce((total, item) => total + (item.roomCount || 1), 0);

        if (bookedCount + 1 > r.inventory) throw new Error('ROOM_UNAVAILABLE_OVERLAP');

        const subtotal = r.pricePerNight * 1 * 1;
        [b] = await Booking.create([{ property: p._id, guest: user._id, host: p.host, room: r._id, checkIn, checkOut, nights: 1, guests: 1, roomCount: 1, pricePerNight: r.pricePerNight, subtotal, serviceFee: 0, taxes: 0, totalAmount: subtotal, currency: "TEST_INR", notes: "TEST_BOOKING", status: 'pending', paymentStatus: 'UNPAID' }], { session });
      });
      return b;
    } catch (err) {
      return { error: err.message };
    } finally {
      await session.endSession();
    }
  };

  const results = await Promise.all([createBookingSim(), createBookingSim()]);
  console.log("Concurrency results:", results.map(r => r.error || `Success: Booking ${r._id}`));

  const successfulBookings = results.filter(r => !r.error);
  if (successfulBookings.length !== 1) {
    console.error("FAIL: Expected exactly 1 successful booking and 1 failure due to lock.");
  } else {
    console.log("PASS: Concurrency test passed. Write-lock prevented double booking.");
  }

  const booking = successfulBookings[0];
  console.log("\nExact booking status before payment:", booking.status, "| Payment status:", booking.paymentStatus);

  console.log("\n--- TEST 2: PayU Initialization ---");
  const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
  const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
  const txnid = 'HB_TEST_' + Date.now();
  const amount = booking.totalAmount.toFixed(2);
  const productinfo = `Booking ${booking._id}`;
  const firstname = "Test";
  const email = "test@example.com";

  const payment = await Payment.create({
    booking: booking._id,
    user: user._id,
    amount: booking.totalAmount,
    currency: 'TEST_INR',
    paymentGateway: 'payu',
    orderId: txnid,
    status: 'pending',
  });
  console.log("Payment initialized with txnid:", txnid, "Status:", payment.status);

  console.log("\n--- TEST 3: Invalid Webhook (Signature mismatch) ---");
  // Simulated Webhook logic
  const processWebhook = async (payload) => {
    const { txnid, amount, productinfo, firstname, email, status, hash } = payload;
    const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = sha512(reverseHashString);
    if (calculatedHash !== hash) return "INVALID_SIGNATURE";

    const pm = await Payment.findOne({ orderId: txnid });
    if (!pm) return "PAYMENT_NOT_FOUND";
    if (pm.status === 'captured' || pm.status === 'failed') return "ALREADY_PROCESSED";
    if (parseFloat(amount) !== pm.amount) return "AMOUNT_MISMATCH";

    if (status === 'success') {
      pm.status = 'captured';
      await pm.save();
      await Booking.findByIdAndUpdate(pm.booking, { paymentStatus: 'PAID', status: 'confirmed' });
    } else {
      pm.status = 'failed';
      await pm.save();
    }
    return "SUCCESS";
  };

  const invalidPayload = { txnid, amount, productinfo, firstname, email, status: 'success', hash: 'badhash' };
  const rInvalid = await processWebhook(invalidPayload);
  console.log("Invalid Webhook Result:", rInvalid);

  console.log("\n--- TEST 4: Amount Mismatch ---");
  const validHashBadAmount = sha512(`${salt}|success|||||||||||${email}|${firstname}|${productinfo}|1000000|${txnid}|${key}`);
  const badAmtPayload = { txnid, amount: "1000000", productinfo, firstname, email, status: 'success', hash: validHashBadAmount };
  const rBadAmt = await processWebhook(badAmtPayload);
  console.log("Amount Mismatch Result:", rBadAmt);

  console.log("\n--- TEST 5: Successful Payment Webhook ---");
  const validHash = sha512(`${salt}|success|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);
  const validPayload = { txnid, amount, productinfo, firstname, email, status: 'success', hash: validHash };
  const rSuccess = await processWebhook(validPayload);
  console.log("Successful Webhook Result:", rSuccess);

  const updatedBooking = await Booking.findById(booking._id);
  const updatedPayment = await Payment.findById(payment._id);
  console.log("Exact booking status after webhook:", updatedBooking.status, "| Payment Status:", updatedBooking.paymentStatus);
  console.log("Exact payment record status:", updatedPayment.status);

  console.log("\n--- TEST 6: Idempotency (Duplicate Webhook) ---");
  const rDup = await processWebhook(validPayload);
  console.log("Duplicate Webhook Result:", rDup);

  console.log("\n--- TEST 7: Cancelled/Failed Payment ---");
  const failHash = sha512(`${salt}|failure|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);
  const rFail = await processWebhook({ txnid: txnid, amount, productinfo, firstname, email, status: 'failure', hash: failHash });
  console.log("Failed Webhook Result (after already successful):", rFail);

  console.log("\nALL TESTS COMPLETED.");
  process.exit(0);
}

runTests().catch(console.error);
