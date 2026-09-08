import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IBooking {
  property: Types.ObjectId;
  guest: Types.ObjectId;
  host: Types.ObjectId;
  room: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  roomCount: number;
  pricePerNight: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'rejected';
  subtotal: number;
  serviceFee: number;
  taxes: number;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

const bookingSchema = new Schema<IBooking>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    guest: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    host: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    roomCount: { type: Number, required: true, min: 1, default: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    subtotal: { type: Number, required: true, min: 0 },
    serviceFee: { type: Number, required: true, min: 0 },
    taxes: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'REFUNDED', 'FAILED'],
      default: 'UNPAID',
    },
    currency: { type: String, required: true, default: 'INR', uppercase: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

bookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1, status: 1, createdAt: -1 });
bookingSchema.index({ host: 1, status: 1, checkIn: 1 });

export const Booking: Model<IBooking> = model<IBooking>('Booking', bookingSchema);
