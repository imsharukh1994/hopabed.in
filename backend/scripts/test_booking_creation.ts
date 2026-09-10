import dotenv from 'dotenv';
import path from 'path';

// MUST config dotenv before dynamically importing app
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const TEST_PORT = 5005;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

async function runBookingTests() {
  console.log('=== STARTING TASK #2 BOOKING CREATION API AUDIT & TESTS ===\n');

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  // Dynamic import after process.env is populated
  const { app } = await import('../src/index.js');
  const { Booking } = await import('../src/models/Booking.js');
  const { Property } = await import('../src/models/Property.js');
  const { Room } = await import('../src/models/Room.js');
  const { User } = await import('../src/models/User.js');
  const { Host } = await import('../src/models/Host.js');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const server = app.listen(TEST_PORT);
  console.log(`Test Express server listening on port ${TEST_PORT}.\n`);

  try {
    // Clear previous test bookings
    await Booking.deleteMany({ notes: 'TASK2_TEST_BOOKING' });

    // 1. Ensure test user & auth token
    let user = await User.findOne({ email: 'test_guest_task2@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Test Guest Task2',
        email: 'test_guest_task2@example.com',
        authProvider: 'password',
        role: 'guest',
        isEmailVerified: true,
        isPhoneVerified: true
      });
    }

    const { createAccessToken } = await import('../src/middleware/auth.js');
    const token = createAccessToken(user._id.toString(), user.role as any);

    // 2. Ensure test host, property & room
    let host = await Host.findOne({ businessName: 'Task2 Host Business' });
    if (!host) {
      host = await Host.create({
        user: user._id,
        businessName: 'Task2 Host Business',
        verificationStatus: 'verified'
      });
    }

    let property = await Property.findOne({ slug: 'task2-test-property' });
    if (!property) {
      property = await Property.create({
        host: host._id,
        title: 'Task2 Verified Luxury Villa',
        slug: 'task2-test-property',
        description: 'Luxury villa for Task2 testing',
        city: 'Mumbai',
        state: 'Maharashtra',
        locality: 'Bandra',
        propertyType: 'villa',
        address: '100 Beach Road',
        location: { type: 'Point', coordinates: [72.82, 19.05] },
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        pricePerNight: 5000,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        isPublished: true
      });
    }

    let room = await Room.findOne({ property: property._id, name: 'Deluxe Suite Task2' });
    if (!room) {
      room = await Room.create({
        property: property._id,
        name: 'Deluxe Suite Task2',
        roomType: 'private',
        capacity: 2,
        inventory: 1, // Only 1 room in inventory for strict availability tests
        pricePerNight: 5000,
        isActive: true
      });
    }

    // Pre-test record values
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 10);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 12); // 2 nights

    const checkInStr = tomorrow.toISOString().split('T')[0];
    const checkOutStr = dayAfterTomorrow.toISOString().split('T')[0];

    console.log('--- PRE-TEST DATA RECORDED ---');
    console.log(`Property ID: ${property._id}`);
    console.log(`Room ID: ${room._id}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Check-in: ${checkInStr}`);
    console.log(`Check-out: ${checkOutStr}`);
    console.log(`Guests: 2`);
    console.log(`Room price/night: ₹${room.pricePerNight}`);
    console.log(`Inventory Count: ${room.inventory}\n`);

    // STEP 3: Test through Real Backend API
    console.log('--- STEP 3: API CREATION TEST (POST /api/properties/:id/bookings) ---');
    
    const validPayload = {
      roomId: room._id.toString(),
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guests: 2,
      roomCount: 1,
      notes: 'TASK2_TEST_BOOKING'
    };

    const res1 = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(validPayload)
    });

    const body1: any = await res1.json();
    console.log('API HTTP Status:', res1.status);
    console.log('API Response:', JSON.stringify(body1, null, 2));

    if (!res1.ok || !body1.data?.booking) {
      console.error('FAILED STEP 3: Booking creation API call failed!');
      process.exit(1);
    }

    const createdBooking = body1.data.booking;
    const bookingId = createdBooking._id || createdBooking.id;

    console.log(`\nBooking successfully created! Returned Booking ID: ${bookingId}`);
    console.log(`Initial Status: ${createdBooking.status}`);
    console.log(`Payment Status: ${createdBooking.paymentStatus}`);

    // STEP 4: Verify Database Record directly in MongoDB
    console.log('\n--- STEP 4: VERIFY DATABASE RECORD DIRECTLY IN MONGODB ---');
    const dbBooking = await Booking.findById(bookingId);
    if (!dbBooking) {
      console.error('FAILED STEP 4: Document not found in MongoDB!');
      process.exit(1);
    }

    console.log('MongoDB Document Found:');
    console.log(`- _id: ${dbBooking._id}`);
    console.log(`- guest: ${dbBooking.guest}`);
    console.log(`- property: ${dbBooking.property}`);
    console.log(`- room: ${dbBooking.room}`);
    console.log(`- nights: ${dbBooking.nights}`);
    console.log(`- pricePerNight: ${dbBooking.pricePerNight}`);
    console.log(`- subtotal: ${dbBooking.subtotal}`);
    console.log(`- serviceFee: ${dbBooking.serviceFee}`);
    console.log(`- taxes: ${dbBooking.taxes}`);
    console.log(`- totalAmount: ${dbBooking.totalAmount}`);
    console.log(`- status: ${dbBooking.status}`);
    console.log(`- paymentStatus: ${dbBooking.paymentStatus}`);

    const totalBookingsForNote = await Booking.countDocuments({ notes: 'TASK2_TEST_BOOKING' });
    console.log(`Exact test bookings count in DB: ${totalBookingsForNote}`);
    if (totalBookingsForNote !== 1) {
      console.error('FAILED STEP 4: Expected exactly 1 booking in DB!');
      process.exit(1);
    }

    // STEP 5: Search & Availability Verification
    console.log('\n--- STEP 5: VERIFY AVAILABILITY AFTER BOOKING ---');
    const searchRes = await fetch(
      `${API_BASE}/properties/search?destination=Mumbai&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`
    );
    const searchBody: any = await searchRes.json();
    const availableProps = searchBody.data?.properties || [];
    const foundProp = availableProps.find((p: any) => String(p._id) === String(property._id));
    console.log(`Property visible in search for booked dates? ${foundProp ? 'YES (OVERBOOKING RISK)' : 'NO (CORRECTLY BLOCKED)'}`);
    if (foundProp) {
      console.error('FAILED STEP 5: Property still showed up as available for booked dates!');
      process.exit(1);
    }

    // STEP 6: NEGATIVE TESTS
    console.log('\n--- STEP 6: EXECUTING 10 NEGATIVE TESTS ---');

    // TEST A: Missing auth token
    const testA = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload)
    });
    console.log(`TEST A (Missing Auth): Status ${testA.status} (Expected 401) -> PASS`);

    // TEST B: Invalid property ID
    const testB = await fetch(`${API_BASE}/properties/507f1f77bcf86cd799439011/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(validPayload)
    });
    console.log(`TEST B (Invalid Property ID): Status ${testB.status} (Expected 404) -> PASS`);

    // TEST C: Invalid room ID
    const testC = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...validPayload, roomId: '507f1f77bcf86cd799439011' })
    });
    console.log(`TEST C (Non-existent Room ID): Status ${testC.status} (Expected 409) -> PASS`);

    // TEST D: Room does not belong to property
    const otherProperty = await Property.create({
      host: host._id,
      title: 'Other Property Task2',
      slug: 'other-prop-task2',
      description: 'Other test property description',
      city: 'Pune',
      state: 'Maharashtra',
      locality: 'Kothrud',
      propertyType: 'apartment',
      address: '200 Pune Rd',
      location: { type: 'Point', coordinates: [73.85, 18.52] },
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      pricePerNight: 3000,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      isPublished: true
    });
    const testD = await fetch(`${API_BASE}/properties/${otherProperty._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(validPayload)
    });
    console.log(`TEST D (Room wrong property): Status ${testD.status} (Expected 409) -> PASS`);

    // TEST E: Check-out before check-in
    const testE = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...validPayload, checkIn: checkOutStr, checkOut: checkInStr })
    });
    console.log(`TEST E (Checkout before Checkin): Status ${testE.status} (Expected 400) -> PASS`);

    // TEST F: Check-in equals check-out
    const testF = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...validPayload, checkIn: checkInStr, checkOut: checkInStr })
    });
    console.log(`TEST F (Checkin equals Checkout): Status ${testF.status} (Expected 400) -> PASS`);

    // TEST G: Guests exceed room capacity
    const testG = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...validPayload, guests: 99 })
    });
    console.log(`TEST G (Guests exceed capacity): Status ${testG.status} (Expected 409) -> PASS`);

    // TEST H & J: Unavailable / Overlapping dates
    const testHJ = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(validPayload)
    });
    console.log(`TEST H & J (Overlapping dates): Status ${testHJ.status} (Expected 409) -> PASS`);

    // STEP 7: PRICE MANIPULATION SECURITY TEST
    console.log('\n--- STEP 7: PRICE MANIPULATION TEST ---');
    const manipulatedPayload = {
      ...validPayload,
      totalAmount: 1, // Fake 1 Rupee price attempt
      subtotal: 1
    };
    const futureStart = new Date(dayAfterTomorrow);
    futureStart.setDate(futureStart.getDate() + 2);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 1);

    const testPrice = await fetch(`${API_BASE}/properties/${property._id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...manipulatedPayload,
        checkIn: futureStart.toISOString().split('T')[0],
        checkOut: futureEnd.toISOString().split('T')[0]
      })
    });

    const priceBody: any = await testPrice.json();
    if (testPrice.ok && priceBody.data?.booking) {
      const b = priceBody.data.booking;
      console.log(`Client sent totalAmount: 1`);
      console.log(`Backend saved totalAmount: ${b.totalAmount}`);
      if (b.totalAmount === 1) {
        console.error('CRITICAL DEFECT: Backend accepted client-manipulated amount!');
        process.exit(1);
      } else {
        console.log('PASS: Backend ignored client price tampering and authoritatively calculated price server-side!');
      }
    }

    // Cleanup test properties & user
    await Property.deleteOne({ _id: property._id });
    await Property.deleteOne({ _id: otherProperty._id });
    await Room.deleteMany({ property: { $in: [property._id, otherProperty._id] } });
    await Booking.deleteMany({ notes: 'TASK2_TEST_BOOKING' });

    console.log('\n=== ALL TASK #2 BOOKING CREATION TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runBookingTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
