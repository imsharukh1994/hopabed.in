import { OwnerVerification, type IOwnerVerification } from '../models/OwnerVerification.js';
import { Host } from '../models/Host.js';
import { Types } from 'mongoose';

export interface VerifyGovIdInput {
  hostId: string;
  userId: string;
  idType: 'aadhaar' | 'passport' | 'driving_licence' | 'voter_id';
  // Optional simulated payload or auth code from provider (raw document numbers never saved)
  verificationCode?: string;
}

export interface VerifyPanInput {
  hostId: string;
  userId: string;
  panNumber: string; // e.g. ABCDE1234F
  panName: string;
}

/**
/ Helper to securely mask PAN numbers (e.g. ABCDE1234F -> XXXXX1234F or XXXXXX1234)
 */
export function maskPanNumber(pan: string): string {
  const cleanPan = pan.trim().toUpperCase();
  if (cleanPan.length < 10) return 'XXXXXXXXXX';
  return 'XXXXX' + cleanPan.slice(5);
}

/**
 * Validate PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
 */
export function isValidPanFormat(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
  return panRegex.test(pan.trim());
}

/**
 * Process primary Government ID verification (e-KYC provider abstraction)
 * DOES NOT store raw Aadhaar numbers or raw ID document files in Hopebed DB.
 */
export async function verifyOwnerGovernmentId(input: VerifyGovIdInput): Promise<IOwnerVerification> {
  const { hostId, userId, idType } = input;

  if (!Types.ObjectId.isValid(hostId) || !Types.ObjectId.isValid(userId)) {
    throw new Error('INVALID_ID');
  }

  // Simulate e-KYC provider verification (e.g., Digilocker / Signzy / Karza / NSDL)
  // Store ONLY verification status and metadata
  const providerReference = `EKYC-${idType.toUpperCase()}-${Date.now()}`;
  
  let record = await OwnerVerification.findOne({ host: hostId });
  if (!record) {
    record = new OwnerVerification({
      host: hostId,
      user: userId,
      governmentIdType: idType,
      governmentIdStatus: 'verified',
      panStatus: 'unverified',
      verificationStatus: 'pending',
      provider: 'hopebed_ekyc_provider',
      providerReference,
      verifiedAt: new Date(),
      verificationAttempts: 1,
    });
  } else {
    record.governmentIdType = idType;
    record.governmentIdStatus = 'verified';
    record.providerReference = providerReference;
    record.verificationAttempts = (record.verificationAttempts || 0) + 1;
    
    // Check if PAN is also verified to complete overall owner verification
    if (record.panStatus === 'verified') {
      record.verificationStatus = 'verified';
      record.verifiedAt = new Date();
    }
  }

  await record.save();

  // Also update Host model verification & kyc status
  const isFullyVerified = record.governmentIdStatus === 'verified' && record.panStatus === 'verified';
  await Host.findByIdAndUpdate(hostId, {
    verificationStatus: isFullyVerified ? 'verified' : 'pending',
    kycStatus: isFullyVerified ? 'verified' : 'pending',
  });

  return record;
}

/**
 * Process PAN Verification
 * Store only masked PAN and verification status.
 */
export async function verifyOwnerPAN(input: VerifyPanInput): Promise<IOwnerVerification> {
  const { hostId, userId, panNumber, panName } = input;

  if (!Types.ObjectId.isValid(hostId) || !Types.ObjectId.isValid(userId)) {
    throw new Error('INVALID_ID');
  }

  if (!isValidPanFormat(panNumber)) {
    throw new Error('INVALID_PAN_FORMAT');
  }

  if (!panName || panName.trim().length < 2) {
    throw new Error('INVALID_PAN_NAME');
  }

  const maskedPan = maskPanNumber(panNumber);
  const providerRef = `PAN-VERIF-${Date.now()}`;

  let record = await OwnerVerification.findOne({ host: hostId });
  if (!record) {
    record = new OwnerVerification({
      host: hostId,
      user: userId,
      governmentIdStatus: 'unverified',
      panStatus: 'verified',
      panNumberMasked: maskedPan,
      panName: panName.trim(),
      verificationStatus: 'pending',
      provider: 'hopebed_pan_verifier',
      providerReference: providerRef,
      verificationAttempts: 1,
    });
  } else {
    record.panStatus = 'verified';
    record.panNumberMasked = maskedPan;
    record.panName = panName.trim();
    record.verificationAttempts = (record.verificationAttempts || 0) + 1;

    if (record.governmentIdStatus === 'verified') {
      record.verificationStatus = 'verified';
      record.verifiedAt = new Date();
    }
  }

  await record.save();

  const isFullyVerified = record.governmentIdStatus === 'verified' && record.panStatus === 'verified';
  await Host.findByIdAndUpdate(hostId, {
    verificationStatus: isFullyVerified ? 'verified' : 'pending',
    kycStatus: isFullyVerified ? 'verified' : 'pending',
  });

  return record;
}
