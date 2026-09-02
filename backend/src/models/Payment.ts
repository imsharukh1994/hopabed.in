import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IPayment {
  booking: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  paymentGateway: 'razorpay' | 'manual';
  paymentId?: string;
  orderId?: string;
  signature?: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<IPayment>;

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', uppercase: true },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'manual'],
      default: 'razorpay',
    },
    paymentId: { type: String, trim: true },
    orderId: { type: String, trim: true },
    signature: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'pending',
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 }, { unique: true });
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ paymentGateway: 1, status: 1 });

export const Payment: Model<IPayment> = model<IPayment>('Payment', paymentSchema);
