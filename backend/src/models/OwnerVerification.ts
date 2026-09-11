import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IOwnerVerification {
  host: Types.ObjectId;
  user: Types.ObjectId;
  governmentIdType?: 'aadhaar' | 'passport' | 'driving_licence' | 'voter_id';
  governmentIdStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  panStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  panNumberMasked?: string;
  panName?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  provider: string;
  providerReference?: string;
  verifiedAt?: Date;
  failureReason?: string;
  verificationAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OwnerVerificationDocument = HydratedDocument<IOwnerVerification>;

const ownerVerificationSchema = new Schema<IOwnerVerification>(
  {
    host: { type: Schema.Types.ObjectId, ref: 'Host', required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
      enum: ['unverified', 'pending', 'verified', 'failed'],
      default: 'unverified',
    },
    provider: { type: String, default: 'hopebed_ekyc', trim: true },
    providerReference: { type: String, trim: true },
    verifiedAt: { type: Date },
    failureReason: { type: String, trim: true },
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
