import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_ENABLED: z.string().default('false'),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default('60m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  WHATSAPP_TOKEN: z.string(),
  WHATSAPP_PHONE_NUMBER_ID: z.string(),
  WHATSAPP_TEMPLATE_NAME: z.string().default('otp_verification'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('karigarhai_verify_token'),

  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),

  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_PUBLIC_URL: z.string(),
  R2_ENDPOINT: z.string(),

  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),
  RAZORPAY_ACCOUNT_NUMBER: z.string(),

  GOOGLE_MAPS_API_KEY: z.string(),

  SENTRY_DSN: z.string().optional(),

  ALLOWED_ORIGINS: z.string(),

  ENCRYPTION_KEY: z.string(),
  ENCRYPTION_IV: z.string(),

  ADMIN_WHATSAPP_NUMBER: z.string(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
