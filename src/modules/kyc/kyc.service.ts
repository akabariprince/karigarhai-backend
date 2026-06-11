import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';
import { FileUploadUtil } from '../../shared/utils/file-upload.util';
import { encryptData, decryptData } from '../../shared/utils/encrypt.util';
import { env } from '../../config/env';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class KYCService {
  /**
   * Submit KYC with Aadhar and PAN documents
   */
  async submitKYCWithDocuments(
    userId: string,
    data: {
      aadhaarNumber: string;
      panNumber: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
    },
    files: {
      aadhaarFront?: UploadedFile[];
      aadhaarBack?: UploadedFile[];
    }
  ) {
    // Validate that required documents are provided
    if (!files.aadhaarFront || files.aadhaarFront.length === 0) {
      throw new ValidationError('Aadhar front image is required');
    }

    if (!files.aadhaarBack || files.aadhaarBack.length === 0) {
      throw new ValidationError('Aadhar back image is required');
    }

    // Check for existing pending submission
    const existing = await prisma.kYCSubmission.findFirst({
      where: { userId, submissionStatus: 'PENDING' },
    });

    if (existing) throw new ValidationError('KYC already pending review');

    // Upload documents to R2
    let aadhaarFrontKey: string, aadhaarBackKey: string;

    try {
      const frontFile = files.aadhaarFront[0];
      const frontUpload = await FileUploadUtil.uploadToR2({
        fileBuffer: frontFile.buffer,
        fileName: frontFile.originalname,
        mimeType: frontFile.mimetype,
        documentType: 'AADHAAR_FRONT',
        userId,
      });
      aadhaarFrontKey = frontUpload.fileKey;

      const backFile = files.aadhaarBack[0];
      const backUpload = await FileUploadUtil.uploadToR2({
        fileBuffer: backFile.buffer,
        fileName: backFile.originalname,
        mimeType: backFile.mimetype,
        documentType: 'AADHAAR_BACK',
        userId,
      });
      aadhaarBackKey = backUpload.fileKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Document upload failed';
      throw new ValidationError(errorMessage);
    }

    // Create KYC submission
    const submission = await prisma.kYCSubmission.create({
      data: {
        userId,
        submissionStatus: 'PENDING',
        aadhaarNumberEncrypted: encryptData(data.aadhaarNumber, env.ENCRYPTION_KEY, env.ENCRYPTION_IV),
        panNumber: data.panNumber,
        bankName: data.bankName,
        accountNumber: data.accountNumber?.slice(-4),
        ifscCode: data.ifscCode,
      },
    });

    // Create document records
    await Promise.all([
      prisma.kYCDocument.upsert({
        where: { userId_documentType: { userId, documentType: 'AADHAAR_FRONT' } },
        create: {
          userId,
          documentType: 'AADHAAR_FRONT',
          r2FileKey: aadhaarFrontKey,
          fileName: files.aadhaarFront[0].originalname,
          fileSizeBytes: files.aadhaarFront[0].size,
          mimeType: files.aadhaarFront[0].mimetype,
        },
        update: {
          r2FileKey: aadhaarFrontKey,
          fileName: files.aadhaarFront[0].originalname,
          fileSizeBytes: files.aadhaarFront[0].size,
          mimeType: files.aadhaarFront[0].mimetype,
          uploadedAt: new Date(),
        },
      }),
      prisma.kYCDocument.upsert({
        where: { userId_documentType: { userId, documentType: 'AADHAAR_BACK' } },
        create: {
          userId,
          documentType: 'AADHAAR_BACK',
          r2FileKey: aadhaarBackKey,
          fileName: files.aadhaarBack[0].originalname,
          fileSizeBytes: files.aadhaarBack[0].size,
          mimeType: files.aadhaarBack[0].mimetype,
        },
        update: {
          r2FileKey: aadhaarBackKey,
          fileName: files.aadhaarBack[0].originalname,
          fileSizeBytes: files.aadhaarBack[0].size,
          mimeType: files.aadhaarBack[0].mimetype,
          uploadedAt: new Date(),
        },
      }),
    ]);

    return {
      submissionId: submission.id,
      status: 'PENDING',
      message: 'KYC submitted successfully. Documents uploaded to R2.',
    };
  }

  /**
   * Submit KYC (legacy - for backward compatibility)
   */
  async submitKYC(userId: string, data: any, documents: any) {
    const existing = await prisma.kYCSubmission.findFirst({
      where: { userId, submissionStatus: 'PENDING' },
    });

    if (existing) throw new ValidationError('KYC already pending review');

    const submission = await prisma.kYCSubmission.create({
      data: {
        userId,
        submissionStatus: 'PENDING',
        panNumber: data.panNumber,
        bankName: data.bankName,
        accountNumber: data.accountNumber?.slice(-4),
        ifscCode: data.ifscCode,
      },
    });

    return { submissionId: submission.id, status: 'PENDING' };
  }

  async getKYCStatus(userId: string) {
    const submission = await prisma.kYCSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) return { status: 'NOT_SUBMITTED' };

    return {
      status: submission.submissionStatus,
      submittedAt: submission.submittedAt,
      approvedAt: submission.approvedAt,
      rejectedAt: submission.rejectedAt,
      rejectionReason: submission.rejectionReason,
    };
  }

  async getKYCSubmissions(page: number, limit: number, status?: string) {
    const { skip, take } = getSkipTake(page, limit);
    const where: any = {};
    if (status) where.submissionStatus = status;

    const [submissions, total] = await Promise.all([
      prisma.kYCSubmission.findMany({
        where,
        include: { 
          user: { 
            select: { 
              phone: true,
              kycDocuments: {
                select: {
                  id: true,
                  documentType: true,
                  r2FileKey: true,
                  fileName: true,
                  fileSizeBytes: true,
                  mimeType: true,
                  uploadedAt: true,
                },
              },
            },
          },
        },
        skip,
        take,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.kYCSubmission.count({ where }),
    ]);

    return { submissions, total, page, limit };
  }

  /**
   * Get KYC submission with signed URLs for documents (admin only)
   */
  async getKYCSubmissionForReview(submissionId: string) {
    const submission = await prisma.kYCSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            isVerified: true,
            kycDocuments: {
              select: {
                id: true,
                documentType: true,
                r2FileKey: true,
                fileName: true,
                fileSizeBytes: true,
                mimeType: true,
                uploadedAt: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundError('KYC submission not found');
    }

    // Generate signed URLs for all documents
    const documentsWithUrls = await Promise.all(
      submission.user.kycDocuments.map(async (doc) => {
        try {
          const signedUrlResult = await FileUploadUtil.generateSignedUrl(doc.r2FileKey);
          return {
            ...doc,
            documentUrl: signedUrlResult.url,
            urlExpiresIn: signedUrlResult.expiresIn,
          };
        } catch (error) {
          console.error(`Failed to generate signed URL for document ${doc.id}:`, error);
          return {
            ...doc,
            documentUrl: null,
            urlExpiresIn: null,
            error: 'Failed to generate document URL',
          };
        }
      })
    );

    let decryptedAadhaar: string | null = null;
    if (submission.aadhaarNumberEncrypted) {
      try {
        decryptedAadhaar = decryptData(submission.aadhaarNumberEncrypted, env.ENCRYPTION_KEY, env.ENCRYPTION_IV);
      } catch (err) {
        console.error('Failed to decrypt Aadhaar number:', err);
      }
    }

    return {
      ...submission,
      aadhaarNumber: decryptedAadhaar || submission.aadhaarNumberEncrypted,
      kycDocuments: documentsWithUrls,
    };
  }

  async approveKYC(userId: string, adminId: string) {
    const submission = await prisma.kYCSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) throw new NotFoundError('No KYC submission found');

    const updated = await prisma.kYCSubmission.update({
      where: { id: submission.id },
      data: {
        submissionStatus: 'APPROVED',
        approvedAt: new Date(),
        reviewedBy: adminId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    return updated;
  }

  async rejectKYC(userId: string, adminId: string, reason: string) {
    const submission = await prisma.kYCSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) throw new NotFoundError('No KYC submission found');

    const updated = await prisma.kYCSubmission.update({
      where: { id: submission.id },
      data: {
        submissionStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        reviewedBy: adminId,
      },
    });

    return updated;
  }
}
