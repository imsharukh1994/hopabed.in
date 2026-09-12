import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

let transporter: Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE ?? false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const from = env.EMAIL_FROM;
    
    if (transporter) {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`[EmailService] Email sent to ${options.to} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } else {
      // Mock / Dev Console Mode when SMTP is not configured
      console.log(`\n===========================================================`);
      console.log(`🔑 [EMAIL DEV MOCK OTP] To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`===========================================================\n`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }
  } catch (error: any) {
    console.error(`[EmailService ERROR] Failed sending email to ${options.to}:`, error?.message || error);
    return { success: false, error: error?.message || 'Email dispatch failed' };
  }
}

// ----------------------------------------------------------------------------
// BRANDED HTML EMAIL LAYOUT HELPER
// ----------------------------------------------------------------------------
function buildEmailTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #334155; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #0d9488; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-top: 16px; text-align: center; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #0d9488; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HOPEBED</h1>
      <p>Seamless Stay Pass & Hospitality Platform</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Hopebed. All rights reserved.</p>
      <p><a href="${env.FRONTEND_URL}">visit hopebed.in</a> | Support: <a href="mailto:support@hopebed.in">support@hopebed.in</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ----------------------------------------------------------------------------
// SPECIFIC EMAIL NOTIFICATION TRIGGERS
// ----------------------------------------------------------------------------

// 1. Welcome Email
export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const subject = `Welcome to Hopebed, ${user.name}! 🌟`;
  const html = buildEmailTemplate(
    subject,
    `
    <h2>Welcome to Hopebed, ${user.name}!</h2>
    <p>We're thrilled to have you join our platform. Whether you're booking your next stay or hosting guests, Hopebed makes stay pass management effortless and secure.</p>
    <div class="card">
      <p style="margin:0; font-weight:600; color:#0f172a;">Account Details:</p>
      <p style="margin:4px 0 0 0; color:#475569;">Email: <strong>${user.email}</strong></p>
    </div>
    <p>Explore properties, manage reservations, and access your digital Stay Passes directly from your account dashboard.</p>
    <a href="${env.FRONTEND_URL}" class="btn">Explore Properties</a>
    `
  );
  return sendEmail({ to: user.email, subject, html });
}

// 2. Booking Confirmation & Digital Stay Pass Email
export async function sendBookingConfirmationEmail(data: {
  guestName: string;
  guestEmail: string;
  bookingId: string;
  propertyTitle: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  stayPassUrl: string;
}) {
  const subject = `Booking Confirmed & Digital Stay Pass — ${data.propertyTitle}`;
  const html = buildEmailTemplate(
    subject,
    `
    <h2 style="color:#0f172a;">Your Booking is Confirmed! 🎉</h2>
    <p>Dear ${data.guestName},</p>
    <p>Thank you for booking with Hopebed. Your payment was successful, and your Digital Stay Pass is ready for check-in.</p>
    
    <div class="card">
      <h3 style="margin:0 0 12px 0; color:#0f172a; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">Reservation Summary</h3>
      <p style="margin:4px 0;"><strong>Booking ID:</strong> <span style="font-family:monospace; font-weight:bold; color:#0d9488;">${data.bookingId}</span></p>
      <p style="margin:4px 0;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin:4px 0;"><strong>Room:</strong> ${data.roomName}</p>
      <p style="margin:4px 0;"><strong>Check-In:</strong> ${new Date(data.checkIn).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
      <p style="margin:4px 0;"><strong>Check-Out:</strong> ${new Date(data.checkOut).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
      <p style="margin:4px 0;"><strong>Total Paid:</strong> ₹${data.totalAmount.toLocaleString('en-IN')}</p>
    </div>

    <p>Show your digital Stay Pass QR code upon arrival at the property for seamless check-in.</p>
    <a href="${data.stayPassUrl}" class="btn">View Digital Stay Pass</a>
    `
  );
  return sendEmail({ to: data.guestEmail, subject, html });
}

// 3. Host New Booking Alert
export async function sendHostBookingAlertEmail(data: {
  hostName: string;
  hostEmail: string;
  bookingId: string;
  propertyTitle: string;
  roomName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
}) {
  const subject = `New Confirmed Booking — ${data.propertyTitle}`;
  const html = buildEmailTemplate(
    subject,
    `
    <h2 style="color:#0f172a;">New Guest Booking Confirmed! 🏨</h2>
    <p>Dear ${data.hostName},</p>
    <p>You have received a new confirmed booking for <strong>${data.propertyTitle}</strong>.</p>
    
    <div class="card">
      <h3 style="margin:0 0 12px 0; color:#0f172a; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">Booking Details</h3>
      <p style="margin:4px 0;"><strong>Booking ID:</strong> <span style="font-family:monospace; color:#0d9488;">${data.bookingId}</span></p>
      <p style="margin:4px 0;"><strong>Guest Name:</strong> ${data.guestName}</p>
      <p style="margin:4px 0;"><strong>Room:</strong> ${data.roomName}</p>
      <p style="margin:4px 0;"><strong>Check-In:</strong> ${new Date(data.checkIn).toLocaleDateString('en-IN')}</p>
      <p style="margin:4px 0;"><strong>Check-Out:</strong> ${new Date(data.checkOut).toLocaleDateString('en-IN')}</p>
      <p style="margin:4px 0;"><strong>Total Payout Value:</strong> ₹${data.totalAmount.toLocaleString('en-IN')}</p>
    </div>

    <p>Please ensure the room is prepared for guest arrival. You can verify guest check-in using the host verify portal.</p>
    <a href="${env.FRONTEND_URL}/verify" class="btn">Host Verify Portal</a>
    `
  );
  return sendEmail({ to: data.hostEmail, subject, html });
}

// 4. Payment Failure Email
export async function sendPaymentFailureEmail(data: {
  guestName: string;
  guestEmail: string;
  bookingId: string;
  propertyTitle: string;
  amount: number;
  reason?: string;
}) {
  const subject = `Payment Failed — Booking ID: ${data.bookingId}`;
  const html = buildEmailTemplate(
    subject,
    `
    <h2 style="color:#e11d48;">Payment Processing Unsuccessful</h2>
    <p>Dear ${data.guestName},</p>
    <p>We were unable to process your payment of <strong>₹${data.amount.toLocaleString('en-IN')}</strong> for <strong>${data.propertyTitle}</strong>.</p>
    
    <div class="card" style="border-left: 4px solid #e11d48;">
      <p style="margin:0;"><strong>Booking Reference:</strong> ${data.bookingId}</p>
      ${data.reason ? `<p style="margin:4px 0 0 0; color:#64748b;">Reason: ${data.reason}</p>` : ''}
    </div>

    <p>Don't worry, your room hold has been safely released. You can attempt to place the reservation again anytime.</p>
    <a href="${env.FRONTEND_URL}" class="btn" style="background-color:#475569;">Try Booking Again</a>
    `
  );
  return sendEmail({ to: data.guestEmail, subject, html });
}

// 5. Booking Cancellation Email
export async function sendCancellationEmail(data: {
  recipientName: string;
  recipientEmail: string;
  bookingId: string;
  propertyTitle: string;
  cancelledBy: string;
  refundStatus?: string;
}) {
  const subject = `Booking Cancelled — ${data.bookingId}`;
  const html = buildEmailTemplate(
    subject,
    `
    <h2>Booking Cancellation Notice</h2>
    <p>Dear ${data.recipientName},</p>
    <p>This is to inform you that booking <strong>${data.bookingId}</strong> for <strong>${data.propertyTitle}</strong> has been cancelled by <strong>${data.cancelledBy}</strong>.</p>
    
    <div class="card">
      <p style="margin:0;"><strong>Booking ID:</strong> ${data.bookingId}</p>
      <p style="margin:4px 0 0 0;"><strong>Status:</strong> CANCELLED</p>
      ${data.refundStatus ? `<p style="margin:4px 0 0 0; color:#0d9488;"><strong>Refund:</strong> ${data.refundStatus}</p>` : ''}
    </div>

    <p>If you have any questions regarding this cancellation, please reach out to customer support.</p>
    `
  );
  return sendEmail({ to: data.recipientEmail, subject, html });
}

// 6. Host Property Status Email (Verified / Rejected)
export async function sendPropertyStatusEmail(data: {
  hostName: string;
  hostEmail: string;
  propertyTitle: string;
  status: 'VERIFIED' | 'REJECTED' | 'CHANGES_REQUESTED';
  rejectionReason?: string;
}) {
  const isApproved = data.status === 'VERIFIED';
  const isChangesRequested = data.status === 'CHANGES_REQUESTED';
  const subject = isApproved
    ? `Congratulations! Property Verified — ${data.propertyTitle}`
    : isChangesRequested
    ? `Revision Requested — ${data.propertyTitle}`
    : `Property Verification Update — ${data.propertyTitle}`;

  const html = buildEmailTemplate(
    subject,
    `
    <h2 style="color:${isApproved ? '#0d9488' : '#e11d48'};">
      ${isApproved ? 'Property Approved & Active! 🚀' : 'Property Listing Needs Revision'}
    </h2>
    <p>Dear ${data.hostName},</p>
    <p>The admin team has reviewed your property submission for <strong>${data.propertyTitle}</strong>.</p>
    
    <div class="card" style="border-left: 4px solid ${isApproved ? '#0d9488' : '#e11d48'};">
      <p style="margin:0;"><strong>Status:</strong> ${data.status}</p>
      ${!isApproved && data.rejectionReason ? `<p style="margin:8px 0 0 0; color:#475569;"><strong>Notes from Admin:</strong> ${data.rejectionReason}</p>` : ''}
    </div>

    ${
      isApproved
        ? '<p>Your property is now live and ready to receive bookings on Hopebed!</p><a href="' + env.FRONTEND_URL + '/host" class="btn">Manage Property</a>'
        : '<p>Please update your listing details per the admin feedback and resubmit for verification.</p><a href="' + env.FRONTEND_URL + '/host" class="btn" style="background-color:#475569;">Edit Listing</a>'
    }
    `
  );
  return sendEmail({ to: data.hostEmail, subject, html });
}

// 7. Admin Property Review Request Alert
export async function sendAdminPropertyReviewAlert(data: {
  adminEmail: string;
  propertyId: string;
  propertyTitle: string;
  hostName: string;
  hostEmail: string;
}) {
  const subject = `[Admin Action Required] New Property Listing Submitted — ${data.propertyTitle}`;
  const html = buildEmailTemplate(
    subject,
    `
    <h2>New Property Submitted for Verification 📋</h2>
    <p>A host has submitted a new property for administrative review.</p>
    
    <div class="card">
      <p style="margin:4px 0;"><strong>Property Title:</strong> ${data.propertyTitle}</p>
      <p style="margin:4px 0;"><strong>Property ID:</strong> ${data.propertyId}</p>
      <p style="margin:4px 0;"><strong>Host Name:</strong> ${data.hostName}</p>
      <p style="margin:4px 0;"><strong>Host Email:</strong> ${data.hostEmail}</p>
    </div>

    <p>Please log in to the admin panel to inspect and approve or reject this listing.</p>
    <a href="${env.FRONTEND_URL}/admin" class="btn">Go to Admin Dashboard</a>
    `
  );
  return sendEmail({ to: data.adminEmail, subject, html });
}

// 8. Email OTP Verification Code
export async function sendOtpEmail(data: { email: string; otp: string }) {
  const subject = `Your Hopebed Verification Code: ${data.otp}`;
  const html = buildEmailTemplate(
    'Hopebed Verification Code',
    `
    <h2 style="color:#0f172a; margin-top:0;">Your Verification Code</h2>
    <p>Use the following 6-digit code to complete your login or registration on Hopebed:</p>
    
    <div className="card" style="background-color:#f8fafc; border:1px border-brand; border-radius:12px; padding:24px; text-align:center; margin:24px 0;">
      <span style="font-size:36px; font-weight:800; letter-spacing:8px; color:#0d9488; font-family:monospace;">${data.otp}</span>
    </div>

    <p style="font-size:13px; color:#64748b;">This code expires in <strong>5 minutes</strong>. If you did not request this verification code, please ignore this email.</p>
    `
  );
  return sendEmail({ to: data.email, subject, html });
}

// 9. Host Verification Status Notification (Verified / Rejected / Suspended)
export async function sendHostVerificationStatusEmail(data: {
  hostName: string;
  hostEmail: string;
  status: 'verified' | 'rejected' | 'suspended' | 'pending';
  rejectionReason?: string;
}) {
  const isVerified = data.status === 'verified';
  const isSuspended = data.status === 'suspended';
  const subject = isVerified
    ? `Host Identity Verified — Welcome to Hopebed Host Network! 🛡️`
    : isSuspended
    ? `Host Account Suspended — Hopebed`
    : `Host Verification Update — Hopebed`;

  const html = buildEmailTemplate(
    subject,
    `
    <h2 style="color:${isVerified ? '#0d9488' : '#e11d48'};">
      ${isVerified ? 'Host Verification Approved! 🎉' : isSuspended ? 'Host Account Suspended' : 'Host Verification Update'}
    </h2>
    <p>Dear ${data.hostName},</p>
    <p>Your Hopebed host identity verification application status is now: <strong>${data.status.toUpperCase()}</strong>.</p>
    
    <div class="card" style="border-left: 4px solid ${isVerified ? '#0d9488' : '#e11d48'};">
      <p style="margin:0;"><strong>Verification Status:</strong> ${data.status.toUpperCase()}</p>
      ${data.rejectionReason ? `<p style="margin:8px 0 0 0; color:#475569;"><strong>Notes / Reason:</strong> ${data.rejectionReason}</p>` : ''}
    </div>

    ${
      isVerified
        ? '<p>You are now a verified host on Hopebed! You can submit properties for property verification and list stays on the platform.</p><a href="' + env.FRONTEND_URL + '/host" class="btn">Go to Host Dashboard</a>'
        : '<p>Please log in to your host account to view details or update your information.</p><a href="' + env.FRONTEND_URL + '/host/verification" class="btn" style="background-color:#475569;">View Verification Status</a>'
    }
    `
  );
  return sendEmail({ to: data.hostEmail, subject, html });
}

