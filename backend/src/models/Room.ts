import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IRoom {
  property: Types.ObjectId;
  name: string;
  roomType: 'private' | 'shared' | 'entire_place';
  capacity: number;
  inventory: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RoomDocument = HydratedDocument<IRoom>;

const roomSchema = new Schema<IRoom>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    roomType: {
      type: String,
      enum: ['private', 'shared', 'entire_place'],
      required: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    inventory: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', uppercase: true },
    amenities: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ property: 1, isActive: 1 });
roomSchema.index({ property: 1, name: 1 }, { unique: true });

export const Room: Model<IRoom> = model<IRoom>('Room', roomSchema);