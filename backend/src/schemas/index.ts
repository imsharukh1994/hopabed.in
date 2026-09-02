import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const mediaMetadataSchema = z.object({
  altText: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(500).optional(),
  uploadedBy: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
});

export const propertyMediaSchema = z.object({
  propertyId: z.string().min(1),
  mediaType: z.enum(['image', 'video', 'document', 'other']),
  fileName: z.string().trim().min(1).max(255),
  objectKey: z.string().trim().min(1),
  url: z.string().url(),
  mimeType: z.string().trim().min(1),
  size: z.number().int().positive(),
  isPrimary: z.boolean().default(false),
  metadata: mediaMetadataSchema.optional(),
});

export const propertyAvailabilitySchema = z.object({
  propertyId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(['available', 'booked', 'blocked']).default('available'),
  price: z.number().nonnegative(),
  minStayNights: z.number().int().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const bookingSchema = z.object({
  propertyId: z.string().min(1),
  guestId: z.string().min(1),
  hostId: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.number().int().min(1),
  notes: z.string().trim().max(500).optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().trim().length(3).default('INR').transform((value) => value.toUpperCase()),
  paymentGateway: z.enum(['razorpay', 'manual']).default('razorpay'),
  status: z.enum(['pending', 'authorized', 'captured', 'failed', 'refunded']).default('pending'),
});
