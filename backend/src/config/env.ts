import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    MONGODB_DB_NAME: z.string().min(1, 'MONGODB_DB_NAME is required'),
    PAYU_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    PAYU_MERCHANT_KEY: z.string().default('gtKFFx'),
    PAYU_MERCHANT_SALT: z.string().default('eCwWELxi'),
    API_URL: z.string().default('http://localhost:4000'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_PUBLIC_URL: z.string().url('R2_PUBLIC_URL must be a valid URL').optional(),
    R2_REGION: z.string().default('auto'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    EMAIL_FROM: z.string().default('Hopebed <noreply@hopebed.in>'),
    ADMIN_ALERT_EMAIL: z.string().default('admin@hopebed.in'),
  })
  .refine(
    (data) => {
      if (data.PAYU_ENV === 'production') {
        if (!data.PAYU_MERCHANT_KEY || data.PAYU_MERCHANT_KEY === 'gtKFFx') {
          return false;
        }
        if (!data.PAYU_MERCHANT_SALT || data.PAYU_MERCHANT_SALT === 'eCwWELxi') {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Production PayU configuration requires valid LIVE PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT.',
      path: ['PAYU_ENV'],
    }
  );

export const env = envSchema.parse(process.env);
