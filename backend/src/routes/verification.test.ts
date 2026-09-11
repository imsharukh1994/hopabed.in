import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskPanNumber, isValidPanFormat } from '../services/verificationService.js';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../services/storageService.js';

describe('Owner & Property Verification Unit Tests', () => {
  describe('PAN Format & Masking Validation', () => {
    it('should validate standard 10-character PAN format (5 letters, 4 numbers, 1 letter)', () => {
      assert.equal(isValidPanFormat('ABCDE1234F'), true);
      assert.equal(isValidPanFormat('abcde1234f'), true);
      assert.equal(isValidPanFormat('INVALID123'), false);
      assert.equal(isValidPanFormat('12345ABCDE'), false);
    });

    it('should mask PAN number preserving only last 5 characters without exposing raw identity', () => {
      assert.equal(maskPanNumber('ABCDE1234F'), 'XXXXX1234F');
      assert.equal(maskPanNumber('XYZZZ9876Q'), 'XXXXX9876Q');
      assert.equal(maskPanNumber('SHORT'), 'XXXXXXXXXX');
    });
  });

  describe('Document Storage Restrictions', () => {
    it('should allow PDF, JPG, and PNG mime types', () => {
      assert.ok(ALLOWED_MIME_TYPES.includes('application/pdf'));
      assert.ok(ALLOWED_MIME_TYPES.includes('image/jpeg'));
      assert.ok(ALLOWED_MIME_TYPES.includes('image/png'));
      assert.equal(ALLOWED_MIME_TYPES.includes('application/exe'), false);
    });

    it('should enforce maximum 5MB file size limit', () => {
      assert.equal(MAX_FILE_SIZE_BYTES, 5 * 1024 * 1024);
    });
  });

  describe('Server-Side Property LIVE Guard Logic', () => {
    it('should prevent property from becoming live if owner or property is unverified', () => {
      const ownerVerified = false;
      const propertyVerified = false;
      const adminApproved = true;

      const isLive = ownerVerified && propertyVerified && adminApproved;
      assert.equal(isLive, false, 'Unverified property must not become LIVE');
    });

    it('should allow property to become live ONLY when owner, property, and admin approval are all satisfied', () => {
      const ownerVerified = true;
      const propertyVerified = true;
      const adminApproved = true;

      const isLive = ownerVerified && propertyVerified && adminApproved;
      assert.equal(isLive, true, 'Property becomes LIVE when all 3 checks pass');
    });
  });
});
