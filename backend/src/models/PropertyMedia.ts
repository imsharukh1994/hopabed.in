import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IPropertyMedia {
  property: Types.ObjectId;
  mediaType: 'image' | 'video' | 'document' | 'other';
  fileName: string;
  objectKey: string;
  url: string;
  mimeType: string;
  size: number;
  isPrimary: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyMediaDocument = HydratedDocument<IPropertyMedia>;

const propertyMediaSchema = new Schema<IPropertyMedia>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document', 'other'],
      required: true,
    },
    fileName: { type: String, required: true, trim: true },
    objectKey: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
    isPrimary: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

propertyMediaSchema.index({ property: 1, isPrimary: 1 });
propertyMediaSchema.index({ property: 1, mediaType: 1 });
propertyMediaSchema.index({ createdAt: -1 });

export const PropertyMedia: Model<IPropertyMedia> = model<IPropertyMedia>('PropertyMedia', propertyMediaSchema);
