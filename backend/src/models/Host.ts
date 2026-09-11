import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IHost {
  user: Types.ObjectId;
  businessName?: string;
  propertyCount: number;
  averageRating: number;
  reviewCount: number;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'failed';
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type HostDocument = HydratedDocument<IHost>;

const hostSchema = new Schema<IHost>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, trim: true, maxlength: 120 },
    propertyCount: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'failed'],
      default: 'unverified',
    },
    kycStatus: {
      type: String,
      enum: ['not_started', 'pending', 'verified', 'rejected'],
      default: 'not_started',
    },
    bio: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hostSchema.index({ user: 1 }, { unique: true });
hostSchema.index({ verificationStatus: 1, isActive: 1 });
hostSchema.index({ averageRating: -1, reviewCount: -1 });

export const Host: Model<IHost> = model<IHost>('Host', hostSchema);
