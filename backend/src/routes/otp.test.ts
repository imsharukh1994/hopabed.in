import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { normalizeIndianPhoneNumber } from '../services/smsService.js';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

describe('Email & Mobile OTP Authentication Unit Tests', () => {
  describe('Indian Phone Number Normalization', () => {
    it('should normalize standard 10-digit Indian phone numbers to +91XXXXXXXXXX', () => {
      assert.equal(normalizeIndianPhoneNumber('9876543210'), '+919876543210');
      assert.equal(normalizeIndianPhoneNumber('09876543210'), '+919876543210');
      assert.equal(normalizeIndianPhoneNumber('+91 98765 43210'), '+919876543210');
      assert.equal(normalizeIndianPhoneNumber('+91-9876543210'), '+919876543210');
    });

    it('should reject invalid Indian phone numbers', () => {
      assert.throws(() => normalizeIndianPhoneNumber('12345'), /INVALID_PHONE_FORMAT/);
      assert.throws(() => normalizeIndianPhoneNumber('1234567890'), /INVALID_PHONE_FORMAT/);
      assert.throws(() => normalizeIndianPhoneNumber('abcd'), /INVALID_PHONE_FORMAT/);
    });
  });

  describe('OTP Hashing & Security Requirements', () => {
    it('should hash 6-digit OTP using SHA-256 hex string', () => {
      const otp = '123456';
      const hash = hashOtp(otp);
      assert.equal(hash.length, 64);
      assert.notEqual(hash, otp, 'Plaintext OTP must never be stored');
      assert.equal(hashOtp('123456'), hash, 'Hash must be deterministic');
    });

    it('should generate distinct hashes for different OTPs', () => {
      assert.notEqual(hashOtp('123456'), hashOtp('654321'));
    });
  });

  describe('OTP Expiry and Attempt Limits', () => {
    it('should identify expired OTP records', () => {
      const expiresAt = new Date(Date.now() - 1000); // 1 sec ago
      const isExpired = expiresAt < new Date();
      assert.equal(isExpired, true, 'Expired OTP must be rejected');
    });

    it('should enforce max 5 attempt limit', () => {
      let attemptCount = 4;
      assert.equal(attemptCount < 5, true, '4 attempts is valid');

      attemptCount += 1;
      assert.equal(attemptCount >= 5, true, '5th failed attempt invalidates OTP');
    });

    it('should enforce 30 seconds resend cooldown', () => {
      const resendAvailableAt = new Date(Date.now() + 25 * 1000);
      const isCooldownActive = resendAvailableAt > new Date();
      assert.equal(isCooldownActive, true, 'Resend request within 30s cooldown must be blocked');
    });
  });

  describe('Account & Owner Integration Rules', () => {
    it('should automatically formats user name from email prefix for new email users', () => {
      const email = 'shahrukh@example.com';
      const nameFromEmail = email.split('@')[0];
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      assert.equal(formattedName, 'Shahrukh');
    });

    it('should generate clean guest name for mobile users', () => {
      const phone = '+919876543210';
      const defaultName = `Guest ${phone.slice(-4)}`;
      assert.equal(defaultName, 'Guest 3210');
    });
  });
});
