import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: 'guest' | 'host' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      match: [/^\+?[0-9\s-]{8,15}$/, 'Invalid phone number format'],
    },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ['guest', 'host', 'admin'],
      default: 'guest',
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isEmailVerified: 1 });
userSchema.index({ createdAt: -1 });

export const User: Model<IUser> = model<IUser>('User', userSchema);
