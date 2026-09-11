import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export type DocumentTypeEnum =
  | 'ownership'
  | 'lease_agreement'
  | 'owner_authorization'
  | 'noc'
  | 'address_proof'
  | 'gst'
  | 'shop_establishment'
  | 'other';

export interface IPropertyVerificationDocument {
  property: Types.ObjectId;
  documentType: DocumentTypeEnum;
  storageReference: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyVerificationDoc = HydratedDocument<IPropertyVerificationDocument>;

const propertyVerificationDocSchema = new Schema<IPropertyVerificationDocument>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    documentType: {
      type: String,
      enum: [
        'ownership',
        'lease_agreement',
        'owner_authorization',
        'noc',
        'address_proof',
        'gst',
        'shop_establishment',
        'other',
      ],
      required: true,
    },
    storageReference: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    uploadedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

propertyVerificationDocSchema.index({ property: 1, documentType: 1 });

export const PropertyVerificationDocument: Model<IPropertyVerificationDocument> =
  model<IPropertyVerificationDocument>('PropertyVerificationDocument', propertyVerificationDocSchema);
