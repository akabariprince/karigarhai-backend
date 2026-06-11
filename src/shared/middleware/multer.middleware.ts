import multer, { StorageEngine } from 'multer';
import { Request } from 'express';

// Use memory storage since we'll upload to R2
const storage: StorageEngine = multer.memoryStorage();

// File filter for KYC documents
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG and PNG allowed.`));
  }
};

// Multer instance for KYC documents
export const kycUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 2, // Maximum 2 files (front and back)
  },
});

/**
 * Multer error handler middleware
 */
export const multerErrorHandler = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2MB.',
        error: err.code,
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 2 files.',
        error: err.code,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.code,
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

export const jobUpload = multer({
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedAudioMimes = [
      'audio/webm',
      'audio/mp3',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/x-m4a',
      'audio/m4a',
      'audio/mp4',
      'application/octet-stream',
    ];
    if (allowedImageMimes.includes(file.mimetype) || allowedAudioMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: Images (JPEG/PNG) and Audio.`));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});
