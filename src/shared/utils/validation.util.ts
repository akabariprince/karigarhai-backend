import { ZodSchema, ZodError } from 'zod';

export const parsePhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }
  throw new Error('Invalid phone number format');
};

export const validateIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  let target = cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    target = cleaned.slice(2);
  }
  if (target.length !== 10) return false;
  const firstDigit = parseInt(target[0]);
  return firstDigit >= 6 && firstDigit <= 9;
};

export const validateIndianPincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode);
};

export const validateCoordinates = (
  lat: number,
  lng: number
): boolean => {
  return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98;
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getGridCell = (lat: number, lng: number): string => {
  const gridLat = Math.round(lat / 0.005) * 0.005;
  const gridLng = Math.round(lng / 0.005) * 0.005;
  return `${gridLat}:${gridLng}`;
};

export const validateZodSchema = async (
  schema: ZodSchema,
  data: unknown
): Promise<{ valid: boolean; errors?: Array<{ field: string; message: string }> }> => {
  try {
    await schema.parseAsync(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { valid: false, errors };
    }
    return { valid: false };
  }
};

export const calculatePlatformFee = (
  grossAmount: number,
  feePercentage: number = 0.09
): { platformFee: number; karigarAmount: number } => {
  const platformFee = Math.round(grossAmount * feePercentage);
  const karigarAmount = grossAmount - platformFee;
  return { platformFee, karigarAmount };
};
