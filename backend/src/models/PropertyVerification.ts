import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IPropertyVerification {
  property: Types.ObjectId;
  host: Types.ObjectId;
  isOwner: boolean;
  operatorRole: 'owner' | 'lease_holder' | 'property_manager' | 'authorized_operator';
  status: 'draft' | 'pending' | 'verified' | 'changes_requested' | 'rejected' | 'suspended';
  submittedAt?: Date;
  verifiedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyVerificationDocumentType = HydratedDocument<IPropertyVerification>;

const propertyVerificationSchema = new Schema<IPropertyVerification>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, unique: true },
    host: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
    isOwner: { type: Boolean, default: true },
    operatorRole: {
      type: String,
      enum: ['owner', 'lease_holder', 'property_manager', 'authorized_operator'],
      default: 'owner',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'changes_requested', 'rejected', 'suspended'],
      default: 'draft',
    },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },
    verificationNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

propertyVerificationSchema.index({ host: 1, status: 1 });

export const PropertyVerification: Model<IPropertyVerification> = model<IPropertyVerification>(
  'PropertyVerification',
  propertyVerificationSchema
);
