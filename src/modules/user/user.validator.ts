import { z } from 'zod';
import { validateIndianPincode, validateCoordinates } from '../../shared/utils/validation.util';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  profilePhotoUrl: z.string().url().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  pincode: z.string().refine(validateIndianPincode, 'Invalid pincode').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  role: z.enum(['KARIGAR', 'MALIK']).optional(),
});

export const updateKarigarProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  trades: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  yearsActive: z.number().min(0).optional(),
  hourlyRate: z.number().min(100).max(2000).optional(),
  dailyRate: z.number().min(300).max(5000).optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
});

export const updateMalikProfileSchema = z.object({
  businessName: z.string().min(1).optional(),
  businessCategory: z.string().optional(),
  businessDescription: z.string().optional(),
  companyRegistration: z.string().optional(),
  gstNumber: z.string().optional(),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateKarigarProfileInput = z.infer<typeof updateKarigarProfileSchema>;
export type UpdateMalikProfileInput = z.infer<typeof updateMalikProfileSchema>;
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>;
