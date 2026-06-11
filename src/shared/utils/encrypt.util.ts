import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const getCryptoKey = (key: string): Buffer => {
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
};

const getCryptoIv = (iv: string): Buffer => {
  if (/^[0-9a-fA-F]{24}$/.test(iv)) {
    return Buffer.from(iv, 'hex');
  }
  return crypto.createHash('sha256').update(iv).digest().slice(0, 12);
};

export const encryptData = (data: string, key: string, iv: string): string => {
  const cipher = crypto.createCipheriv(ALGORITHM, getCryptoKey(key), getCryptoIv(iv));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${encrypted}:${authTag.toString('hex')}`;
};

export const decryptData = (encryptedData: string, key: string, iv: string): string => {
  const [encrypted, authTag] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getCryptoKey(key),
    getCryptoIv(iv)
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyOtpHash = (otp: string, hash: string): boolean => {
  const computedHash = hashOtp(otp);
  return computedHash === hash;
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
