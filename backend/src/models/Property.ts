import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IProperty {
  host: Types.ObjectId;
  title: string;
  slug: string;
  propertyType: 'apartment' | 'villa' | 'studio' | 'house' | 'farmstay' | 'guesthouse';
  category: 'stay' | 'hostel' | 'resort' | 'homestay';
  city: string;
  locality: string;
  state: string;
  country: string;
  address: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  currency: string;
  description: string;
  amenities: string[];
  houseRules?: string[];
  isVerified: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  primaryImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyDocument = HydratedDocument<IProperty>;

const propertySchema = new Schema<IProperty>(
  {
    host: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    propertyType: {
      type: String,
      enum: ['apartment', 'villa', 'studio', 'house', 'farmstay', 'guesthouse'],
      required: true,
    },
    category: {
      type: String,
      enum: ['stay', 'hostel', 'resort', 'homestay'],
      default: 'stay',
    },
    city: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'India', trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', uppercase: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    amenities: { type: [String], default: [] },
    houseRules: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    primaryImage: { type: String, trim: true },
  },
  { timestamps: true }
);

propertySchema.index({ host: 1, isPublished: 1 });
propertySchema.index({ city: 1, locality: 1, isPublished: 1 });
propertySchema.index({ pricePerNight: 1, maxGuests: 1 });
propertySchema.index({ isFeatured: 1, isPublished: 1 });
propertySchema.index({ slug: 1 }, { unique: true });
propertySchema.index({ location: '2dsphere' });

export const Property: Model<IProperty> = model<IProperty>('Property', propertySchema);
