import { env } from '../config/env.js';

export interface SendSmsOptions {
  to: string; // E.164 formatted number +91XXXXXXXXXX
  otp: string;
  message?: string;
}

/**
 * Normalize and validate Indian (+91) phone numbers.
 * Supports inputs like '9876543210', '+91 9876543210', '09876543210', '+91-9876543210'.
 * Returns normalized string +91XXXXXXXXXX or throws an error.
 */
export function normalizeIndianPhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('INVALID_PHONE_FORMAT');
  }

  // Remove whitespace, dashes, parentheses
  const cleaned = rawPhone.replace(/[\s\(\)\-]/g, '');

  let tenDigit = '';
  if (cleaned.startsWith('+91')) {
    tenDigit = cleaned.slice(3);
  } else if (cleaned.startsWith('091')) {
    tenDigit = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    tenDigit = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    tenDigit = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    tenDigit = cleaned;
  } else {
    throw new Error('INVALID_PHONE_FORMAT');
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9 and be 10 digits
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(tenDigit)) {
    throw new Error('INVALID_PHONE_FORMAT');
  }

  return `+91${tenDigit}`;
}

/**
 * SMS Provider Abstraction
 * Supports MSG91, Twilio, or Log/Mock mode in development.
 */
export async function sendSmsOTP(options: SendSmsOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedTo = normalizeIndianPhoneNumber(options.to);
    const smsProvider = process.env.SMS_PROVIDER || 'mock';

    if (smsProvider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER || '+1234567890';
      const bodyText = options.message || `Your Hopebed verification code is: ${options.otp}. Valid for 5 minutes.`;

      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: normalizedTo,
        From: fromNumber,
        Body: bodyText,
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SmsService TWILIO ERROR]:', errorData);
        return { success: false, error: 'SMS dispatch failed' };
      }

      console.log(`[SmsService TWILIO] SMS sent successfully to ${normalizedTo}`);
      return { success: true };
    }

    if (smsProvider === 'msg91' && process.env.SMS_API_KEY) {
      const apiKey = process.env.SMS_API_KEY;
      const templateId = process.env.SMS_TEMPLATE_ID || '';
      const mobileNumber = normalizedTo.replace('+', ''); // MSG91 uses number without '+'

      const response = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobileNumber}&otp=${options.otp}`, {
        method: 'POST',
        headers: {
          authkey: apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[SmsService MSG91 ERROR]:', await response.text());
        return { success: false, error: 'SMS dispatch failed' };
      }

      console.log(`[SmsService MSG91] SMS sent successfully to ${normalizedTo}`);
      return { success: true };
    }

    // Default Mock / Dev Console Mode
    if (env.NODE_ENV === 'test') {
      // In unit test environment, don't flood logs
      return { success: true };
    }

    console.log(`[SmsService DEV/MOCK MODE] ------------------------------`);
    console.log(`To: ${normalizedTo}`);
    console.log(`Provider: ${smsProvider}`);
    console.log(`Message: Your Hopebed verification code is [PROTECTED]`);
    console.log(`-----------------------------------------------------------`);
    return { success: true };
  } catch (error: any) {
    if (error.message === 'INVALID_PHONE_FORMAT') {
      return { success: false, error: 'INVALID_PHONE_FORMAT' };
    }
    console.error('[SmsService ERROR]:', error?.message || error);
    return { success: false, error: 'SMS delivery failed' };
  }
}
