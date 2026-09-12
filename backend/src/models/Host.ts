import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IHost {
  user: Types.ObjectId;
  businessName?: string;
  fullName?: string;
  dob?: Date;
  phone?: string;
  email?: string;
  address?: string;
  propertyCount: number;
  averageRating: number;
  reviewCount: number;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended' | 'failed';
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected' | 'suspended';
  bio?: string;
  isActive: boolean;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type HostDocument = HydratedDocument<IHost>;

const hostSchema = new Schema<IHost>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, trim: true, maxlength: 120 },
    fullName: { type: String, trim: true, maxlength: 120 },
    dob: { type: Date },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true, maxlength: 500 },
    propertyCount: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'suspended', 'failed'],
      default: 'unverified',
    },
    kycStatus: {
      type: String,
      enum: ['not_started', 'pending', 'verified', 'rejected', 'suspended'],
      default: 'not_started',
    },
    bio: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },
    verificationNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

hostSchema.index({ user: 1 }, { unique: true });
hostSchema.index({ verificationStatus: 1, isActive: 1 });
hostSchema.index({ averageRating: -1, reviewCount: -1 });

export const Host: Model<IHost> = model<IHost>('Host', hostSchema);
