import { z } from 'zod';
import { validateIndianPhone } from '../../shared/utils/validation.util';

export const checkUserSchema = z.object({
  phone: z
    .string()
    .refine(validateIndianPhone, {
      message: 'Invalid Indian phone number',
    }),
});

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .refine(validateIndianPhone, {
      message: 'Invalid Indian phone number',
    }),
  purpose: z.enum(['SIGNUP', 'LOGIN', 'PASSWORD_RESET', 'PHONE_VERIFICATION']).optional(),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .refine(validateIndianPhone, {
      message: 'Invalid Indian phone number',
    }),
  otp: z
    .string()
    .length(6)
    .regex(/^\d+$/, {
      message: 'OTP must be 6 digits',
    }),
  deviceId: z.string().min(1),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB']),
  role: z.enum(['KARIGAR', 'MALIK']).optional(),
  purpose: z.enum(['SIGNUP', 'LOGIN', 'PASSWORD_RESET', 'PHONE_VERIFICATION']).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type CheckUserInput = z.infer<typeof checkUserSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema> & { purpose?: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION' };
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema> & { purpose?: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION' };
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const adminLoginSchema = z.object({
  phone: z
    .string()
    .refine(validateIndianPhone, {
      message: 'Invalid Indian phone number',
    }),
  password: z.string().min(6),
  deviceId: z.string().min(1),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB']),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
