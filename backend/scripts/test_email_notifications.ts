import {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendHostBookingAlertEmail,
  sendPaymentFailureEmail,
  sendCancellationEmail,
  sendPropertyStatusEmail,
  sendAdminPropertyReviewAlert,
} from '../src/services/emailService.js';

async function runEmailTests() {
  console.log('--- STARTING EMAIL NOTIFICATION TEST SUITE ---');

  const t1 = await sendWelcomeEmail({
    name: 'Rahul Sharma',
    email: 'rahul.test@example.com',
  });
  console.log('1. Welcome Email Test:', t1.success ? 'PASS ✅' : 'FAIL ❌');

  const t2 = await sendBookingConfirmationEmail({
    guestName: 'Rahul Sharma',
    guestEmail: 'rahul.test@example.com',
    bookingId: '66d123456789abcdef012345',
    propertyTitle: 'Hopebed Sea View Villa',
    roomName: 'Deluxe Ocean Suite',
    checkIn: '2026-10-15T14:00:00.000Z',
    checkOut: '2026-10-18T11:00:00.000Z',
    totalAmount: 14500,
    stayPassUrl: 'http://localhost:3000/bookings',
  });
  console.log('2. Booking Confirmation & Stay Pass Test:', t2.success ? 'PASS ✅' : 'FAIL ❌');

  const t3 = await sendHostBookingAlertEmail({
    hostName: 'Amit Patel',
    hostEmail: 'amit.host@example.com',
    bookingId: '66d123456789abcdef012345',
    propertyTitle: 'Hopebed Sea View Villa',
    roomName: 'Deluxe Ocean Suite',
    guestName: 'Rahul Sharma',
    checkIn: '2026-10-15T14:00:00.000Z',
    checkOut: '2026-10-18T11:00:00.000Z',
    totalAmount: 14500,
  });
  console.log('3. Host Booking Alert Test:', t3.success ? 'PASS ✅' : 'FAIL ❌');

  const t4 = await sendPaymentFailureEmail({
    guestName: 'Rahul Sharma',
    guestEmail: 'rahul.test@example.com',
    bookingId: '66d123456789abcdef012345',
    propertyTitle: 'Hopebed Sea View Villa',
    amount: 14500,
    reason: 'Bank declined transaction (Test simulation)',
  });
  console.log('4. Payment Failure Email Test:', t4.success ? 'PASS ✅' : 'FAIL ❌');

  const t5 = await sendCancellationEmail({
    recipientName: 'Rahul Sharma',
    recipientEmail: 'rahul.test@example.com',
    bookingId: '66d123456789abcdef012345',
    propertyTitle: 'Hopebed Sea View Villa',
    cancelledBy: 'Guest',
    refundStatus: 'Full Refund Initiated',
  });
  console.log('5. Booking Cancellation Email Test:', t5.success ? 'PASS ✅' : 'FAIL ❌');

  const t6 = await sendPropertyStatusEmail({
    hostName: 'Amit Patel',
    hostEmail: 'amit.host@example.com',
    propertyTitle: 'Hopebed Sea View Villa',
    status: 'VERIFIED',
  });
  console.log('6. Property Status (VERIFIED) Email Test:', t6.success ? 'PASS ✅' : 'FAIL ❌');

  const t7 = await sendAdminPropertyReviewAlert({
    adminEmail: 'admin@hopebed.in',
    propertyId: 'prop-987654',
    propertyTitle: 'Hopebed Sea View Villa',
    hostName: 'Amit Patel',
    hostEmail: 'amit.host@example.com',
  });
  console.log('7. Admin Property Review Alert Test:', t7.success ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n--- EMAIL NOTIFICATION TEST SUITE COMPLETE ---');
}

runEmailTests().catch(console.error);
