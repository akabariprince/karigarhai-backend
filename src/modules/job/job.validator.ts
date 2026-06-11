import { z } from 'zod';
import { validateCoordinates } from '../../shared/utils/validation.util';

export const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(1),
  trades: z.array(z.string()).min(1),
  priceType: z.enum(['FIXED', 'HOURLY', 'DAILY']),
  fixedPrice: z.number().min(500).max(500000).optional(),
  hourlyRate: z.number().min(100).max(2000).optional(),
  dailyRate: z.number().min(300).max(5000).optional(),
  totalDays: z.number().min(1).max(90).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  latitude: z.number().refine((val) => val >= 6 && val <= 37),
  longitude: z.number().refine((val) => val >= 68 && val <= 98),
  locality: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().length(6),
  requiredSkills: z.array(z.string()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  voiceNoteUrl: z.string().url().optional(),
  workRadius: z.enum(['5', '10', '20', '50']).optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const jobFiltersSchema = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  trades: z.array(z.string()).optional(),
  priceType: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

export const jobFeedSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  trades: z.array(z.string()).optional(),
  radius: z.number().optional().default(5),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
export type JobFeedInput = z.infer<typeof jobFeedSchema>;
