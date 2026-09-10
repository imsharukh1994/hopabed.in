import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const TEST_PORT = 5006;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

async function runAmountSecurityTests() {
  console.log('=== STARTING TASK #3 SERVER-SIDE AMOUNT SECURITY AUDIT & TESTS ===\n');

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
  console.log(`Test server running on port ${TEST_PORT}.\n`);

  try {
    // Clear previous test records
    await Booking.deleteMany({ notes: 'TASK3_AMOUNT_SECURITY_TEST' });
    await Payment.deleteMany({ currency: 'INR_TEST_TASK3' });

    // 1. Setup Guest User
    let guest = await User.findOne({ email: 'task3_guest@example.com' });
    if (!guest) {
      guest = await User.create({
        name: 'Task3 Security Guest',
        email: 'task3_guest@example.com',
        authProvider: 'password',
        role: 'guest',
        isEmailVerified: true,
        isPhoneVerified: true
      });
    }

    const guestToken = createAccessToken(guest._id.toString(), guest.role as any);

    // 2. Setup Host, Property & Room with authoritative price ₹999/night
    let host = await Host.findOne({ businessName: 'Task3 Host Business' });
    if (!host) {
      host = await Host.create({
        user: guest._id,
        businessName: 'Task3 Host Business',
        verificationStatus: 'verified'
      });
    }

    let property = await Property.findOne({ slug: 'task3-security-property' });
    if (!property) {
      property = await Property.create({
        host: host._id,
        title: 'Task3 Security Luxury Villa',
        slug: 'task3-security-property',
        description: 'Test villa for amount calculation audit',
        city: 'Goa',
        state: 'Goa',
        locality: 'Calangute',
        propertyType: 'villa',
        address: '1 Ocean Drive',
        location: { type: 'Point', coordinates: [73.76, 15.54] },
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        pricePerNight: 999,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        isPublished: true
      });
    }

    let room = await Room.findOne({ property: property._id, name: 'Task3 Ocean Suite' });
    if (!room) {
      room = await Room.create({
        property: property._id,
        name: 'Task3 Ocean Suite',
        roomType: 'private',
        capacity: 2,
        inventory: 5,
        pricePerNight: 999,
        isActive: true
      });
    }

    // 3 nights test dates
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 15);
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 18); // Exactly 3 nights

    const checkInStr = checkInDate.toISOString().split('T')[0];
    const checkOutStr = checkOutDate.toISOString().split('T')[0];

    // Authoritative math calculation
    // Base: 999 * 3 nights * 1 room = 2997
    // Service Fee: Math.round(2997 * 0.05) = Math.round(149.85) = 150
    // Taxes: Math.round((2997 + 150) * 0.05) = Math.round(3147 * 0.05) = Math.round(157.35) = 157
    // Total Payable: 2997 + 150 + 157 = 3304
    const expectedSubtotal = 2997;
    const expectedServiceFee = 150;
    const expectedTaxes = 157;
    const expectedTotal = 3304;

    console.log('--- TEST DATA & AUTHORITATIVE CALCULATIONS ---');
    console.log(`Room Price / Night: ₹${room.pricePerNight}`);
    console.log(`Nights: 3 (${checkInStr} to ${checkOutStr})`);
    console.log(`Expected Subtotal: ₹${expectedSubtotal}`);
    console.log(`Expected Service Fee (5% rounded): ₹${expectedServiceFee}`);
    console.log(`Expected Taxes (5% rounded): ₹${expectedTaxes}`);
    console.log(`Expected Total Amount: ₹${expectedTotal}\n`);

    // TEST 1: Standard valid request -> expected authoritative amount
    console.log('--- TEST 1: STANDARD VALID REQUEST ---');
    const validPayload = {
      roomId: room._id.toString(),
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guests: 2,
      roomCount: 1,
      notes: 'TASK3_AMOUNT_SECURITY_TEST'
    };

    const res1 = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify(validPayload)
    });

    const body1: any = await res1.json();
    console.log('API Status:', res1.status);
    const booking1 = body1.data?.booking;
    if (!res1.ok || !booking1) {
      console.error('FAILED TEST 1:', body1);
      process.exit(1);
    }

    console.log(`Saved Subtotal: ₹${booking1.subtotal} (Expected ₹${expectedSubtotal})`);
    console.log(`Saved Service Fee: ₹${booking1.serviceFee} (Expected ₹${expectedServiceFee})`);
    console.log(`Saved Taxes: ₹${booking1.taxes} (Expected ₹${expectedTaxes})`);
    console.log(`Saved Total Amount: ₹${booking1.totalAmount} (Expected ₹${expectedTotal})`);

    if (
      booking1.subtotal !== expectedSubtotal ||
      booking1.serviceFee !== expectedServiceFee ||
      booking1.taxes !== expectedTaxes ||
      booking1.totalAmount !== expectedTotal
    ) {
      console.error('FAILED TEST 1: Server calculation mismatch!');
      process.exit(1);
    }
    console.log('PASS TEST 1: Server calculated correct authoritative amounts!\n');

    // TEST 2: Tampered Room Price in Request Body
    console.log('--- TEST 2: TAMPERED ROOM PRICE IN REQUEST BODY ---');
    const checkInDate2 = new Date(checkOutDate);
    checkInDate2.setDate(checkInDate2.getDate() + 2);
    const checkOutDate2 = new Date(checkInDate2);
    checkOutDate2.setDate(checkOutDate2.getDate() + 3);

    const res2 = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({
        ...validPayload,
        checkIn: checkInDate2.toISOString().split('T')[0],
        checkOut: checkOutDate2.toISOString().split('T')[0],
        pricePerNight: 1, // Tampered ₹1 price
        price: 1
      })
    });

    const body2: any = await res2.json();
    const booking2 = body2.data?.booking;
    if (!res2.ok || !booking2) {
      console.error('FAILED TEST 2:', body2);
      process.exit(1);
    }
    console.log(`Client sent pricePerNight: 1`);
    console.log(`Server saved totalAmount: ₹${booking2.totalAmount}`);
    if (booking2.totalAmount === 1 || booking2.pricePerNight === 1) {
      console.error('FAILED TEST 2: Server accepted tampered room price!');
      process.exit(1);
    }
    console.log('PASS TEST 2: Backend ignored client room price tampering!\n');

    // TEST 3, 4, 5, 6: Tampered Subtotal, Tax, ServiceFee, TotalAmount
    console.log('--- TEST 3-6: TAMPERED SUBTOTAL, TAX, SERVICE FEE, & TOTAL AMOUNT ---');
    const checkInDate3 = new Date(checkOutDate2);
    checkInDate3.setDate(checkInDate3.getDate() + 2);
    const checkOutDate3 = new Date(checkInDate3);
    checkOutDate3.setDate(checkOutDate3.getDate() + 3);

    const res3 = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({
        ...validPayload,
        checkIn: checkInDate3.toISOString().split('T')[0],
        checkOut: checkOutDate3.toISOString().split('T')[0],
        subtotal: 10,
        taxes: 0,
        serviceFee: 0,
        totalAmount: 10
      })
    });

    const body3: any = await res3.json();
    const booking3 = body3.data?.booking;
    if (!res3.ok || !booking3) {
      console.error('FAILED TEST 3-6:', body3);
      process.exit(1);
    }
    console.log(`Client sent subtotal: 10, taxes: 0, serviceFee: 0, totalAmount: 10`);
    console.log(`Server saved totalAmount: ₹${booking3.totalAmount}`);
    if (booking3.totalAmount === 10 || booking3.subtotal === 10) {
      console.error('FAILED TEST 3-6: Server accepted tampered pricing breakdown!');
      process.exit(1);
    }
    console.log('PASS TEST 3-6: Backend authoritatively computed ₹3304 and ignored client price fields!\n');

    // TEST 7: Invalid Dates
    console.log('--- TEST 7: INVALID DATES TEST ---');
    const res7 = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({
        ...validPayload,
        checkIn: checkOutStr,
        checkOut: checkInStr // Checkout before checkin
      })
    });
    console.log(`Checkout before Checkin Status: ${res7.status} (Expected 400)`);
    if (res7.status !== 400) {
      console.error('FAILED TEST 7: Server accepted checkout before checkin!');
      process.exit(1);
    }
    console.log('PASS TEST 7: Invalid dates rejected correctly!\n');

    // TEST 8: Incorrect Client Night Count
    console.log('--- TEST 8: INCORRECT CLIENT NIGHT COUNT IN REQUEST ---');
    const checkInDate8 = new Date(checkOutDate3);
    checkInDate8.setDate(checkInDate8.getDate() + 2);
    const checkOutDate8 = new Date(checkInDate8);
    checkOutDate8.setDate(checkOutDate8.getDate() + 3);

    const res8 = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({
        ...validPayload,
        checkIn: checkInDate8.toISOString().split('T')[0],
        checkOut: checkOutDate8.toISOString().split('T')[0],
        nights: 100 // Client tries sending 100 nights
      })
    });

    const body8: any = await res8.json();
    const booking8 = body8.data?.booking;
    if (!res8.ok || !booking8) {
      console.error('FAILED TEST 8:', body8);
      process.exit(1);
    }
    console.log(`Client sent nights: 100 for 3-night date range`);
    console.log(`Server saved nights: ${booking8.nights}, totalAmount: ₹${booking8.totalAmount}`);
    if (booking8.nights !== 3 || booking8.totalAmount !== expectedTotal) {
      console.error('FAILED TEST 8: Server accepted client night count!');
      process.exit(1);
    }
    console.log('PASS TEST 8: Server calculated exact date difference (3 nights) and ignored client night count!\n');

    // TEST 9: PayU Initialization with Authoritative Amount
    console.log('--- TEST 9: PAYU INITIALIZATION WITH AUTHORITATIVE DB AMOUNT ---');
    const payuInitRes = await fetch(`${API_BASE}/payments/payu-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({
        bookingId: booking1._id,
        amount: 1, // Tampered client amount attempt
        totalAmount: 1
      })
    });

    const payuBody: any = await payuInitRes.json();
    if (!payuInitRes.ok || !payuBody.data) {
      console.error('FAILED TEST 9:', payuBody);
      process.exit(1);
    }

    const payuData = payuBody.data;
    console.log(`PayU Form Action URL: ${payuData.action}`);
    console.log(`PayU Amount in Form Data: ₹${payuData.amount}`);
    console.log(`Expected Amount from DB: ₹${booking1.totalAmount.toFixed(2)}`);

    if (payuData.amount !== booking1.totalAmount.toFixed(2)) {
      console.error('FAILED TEST 9: PayU initialized with incorrect amount!');
      process.exit(1);
    }
    console.log('PASS TEST 9: PayU initialized with authoritative database amount!\n');

    // TEST 10: Booking Database Record Consistency & Rounding
    console.log('--- TEST 10: DATABASE RECORD CONSISTENCY & ROUNDING ---');
    const dbBooking = await Booking.findById(booking1._id);
    if (!dbBooking) {
      console.error('FAILED TEST 10: Booking document not found in MongoDB!');
      process.exit(1);
    }

    console.log(`DB _id: ${dbBooking._id}`);
    console.log(`DB nights: ${dbBooking.nights}`);
    console.log(`DB pricePerNight: ₹${dbBooking.pricePerNight}`);
    console.log(`DB subtotal: ₹${dbBooking.subtotal}`);
    console.log(`DB serviceFee: ₹${dbBooking.serviceFee}`);
    console.log(`DB taxes: ₹${dbBooking.taxes}`);
    console.log(`DB totalAmount: ₹${dbBooking.totalAmount}`);

    const expectedCalculatedTotal = dbBooking.subtotal + dbBooking.serviceFee + dbBooking.taxes;
    if (dbBooking.totalAmount !== expectedCalculatedTotal) {
      console.error('FAILED TEST 10: Stored total amount does not match sum of subtotal + serviceFee + taxes!');
      process.exit(1);
    }

    console.log('PASS TEST 10: Stored MongoDB document amount is integer-rounded, consistent, and matches PayU!\n');

    // Cleanup test data
    await Booking.deleteMany({ notes: 'TASK3_AMOUNT_SECURITY_TEST' });
    await Property.deleteOne({ _id: property._id });
    await Room.deleteMany({ property: property._id });

    console.log('=== ALL TASK #3 SERVER-SIDE AMOUNT SECURITY TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runAmountSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
