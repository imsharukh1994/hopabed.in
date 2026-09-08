import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IReview {
  property: Types.ObjectId;
  booking: Types.ObjectId;
  guest: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;

const reviewSchema = new Schema<IReview>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    guest: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export const Review: Model<IReview> = model<IReview>('Review', reviewSchema);
