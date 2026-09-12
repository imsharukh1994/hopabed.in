import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IOwnerVerification {
  host: Types.ObjectId;
  user: Types.ObjectId;
  fullName?: string;
  dob?: Date;
  phone?: string;
  email?: string;
  address?: string;
  governmentIdType?: 'aadhaar' | 'passport' | 'driving_licence' | 'voter_id';
  governmentIdStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  panStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  panNumberMasked?: string;
  panName?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended' | 'failed';
  provider: string;
  providerReference?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  failureReason?: string;
  rejectionReason?: string;
  verificationNotes?: string;
  verificationAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OwnerVerificationDocument = HydratedDocument<IOwnerVerification>;

const ownerVerificationSchema = new Schema<IOwnerVerification>(
  {
    host: { type: Schema.Types.ObjectId, ref: 'Host', required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, trim: true, maxlength: 120 },
    dob: { type: Date },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true, maxlength: 500 },
    governmentIdType: {
      type: String,
      enum: ['aadhaar', 'passport', 'driving_licence', 'voter_id'],
    },
    governmentIdStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'failed'],
      default: 'unverified',
    },
    panStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'failed'],
      default: 'unverified',
    },
    panNumberMasked: { type: String, trim: true },
    panName: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'suspended', 'failed'],
      default: 'unverified',
    },
    provider: { type: String, default: 'hopebed_ekyc', trim: true },
    providerReference: { type: String, trim: true },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    failureReason: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    verificationNotes: { type: String, trim: true },
    verificationAttempts: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ownerVerificationSchema.index({ user: 1 });
ownerVerificationSchema.index({ verificationStatus: 1 });

export const OwnerVerification: Model<IOwnerVerification> = model<IOwnerVerification>(
  'OwnerVerification',
  ownerVerificationSchema
);
