import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IPropertyAvailability {
  property: Types.ObjectId;
  room: Types.ObjectId;
  date: Date;
  status: 'available' | 'booked' | 'blocked';
  price: number;
  minStayNights?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyAvailabilityDocument = HydratedDocument<IPropertyAvailability>;

const propertyAvailabilitySchema = new Schema<IPropertyAvailability>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available',
    },
    price: { type: Number, required: true, min: 0 },
    minStayNights: { type: Number, min: 1 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

propertyAvailabilitySchema.index({ room: 1, date: 1 }, { unique: true });
propertyAvailabilitySchema.index({ room: 1, status: 1, date: 1 });

export const PropertyAvailability: Model<IPropertyAvailability> = model<IPropertyAvailability>(
  'PropertyAvailability',
  propertyAvailabilitySchema
);
