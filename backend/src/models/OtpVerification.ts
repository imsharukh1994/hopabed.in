import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface IOtpVerification {
  identifier: string;
  identifierType: 'email' | 'mobile';
  otpHash: string;
  expiresAt: Date;
  attemptCount: number;
  resendAvailableAt: Date;
  verifiedAt?: Date;
  purpose: 'login_register';
  createdAt: Date;
  updatedAt: Date;
}

export type OtpVerificationDocument = HydratedDocument<IOtpVerification>;

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    identifier: { type: String, required: true, trim: true, lowercase: true },
    identifierType: { type: String, enum: ['email', 'mobile'], required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '10m' } }, // TTL index auto cleans up after 10m
    attemptCount: { type: Number, default: 0, min: 0 },
    resendAvailableAt: { type: Date, required: true },
    verifiedAt: { type: Date },
    purpose: { type: String, enum: ['login_register'], default: 'login_register' },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ identifier: 1, identifierType: 1, purpose: 1 });

export const OtpVerification: Model<IOtpVerification> = model<IOtpVerification>(
  'OtpVerification',
  otpVerificationSchema
);
