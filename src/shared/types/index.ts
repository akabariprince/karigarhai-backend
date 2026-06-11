// User Types
export interface IUser {
  id: string;
  phone: string;
  role: 'KARIGAR' | 'MALIK' | 'ADMIN';
  fcmToken?: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  profilePhotoUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceId: string;
  deviceType: string;
  ipAddress: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

// Job Types
export interface IJob {
  id: string;
  malikId: string;
  title: string;
  description: string;
  category: string;
  trades: string[];
  priceType: 'FIXED' | 'HOURLY' | 'DAILY';
  fixedPrice?: number;
  hourlyRate?: number;
  dailyRate?: number;
  totalDays?: number;
  startDate?: Date;
  endDate?: Date;
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  requiredSkills: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  totalApplications: number;
  selectedCount: number;
  imageUrls: string[];
  voiceNoteUrl?: string;
  workRadius: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobApplication {
  id: string;
  jobId: string;
  karigarId: string;
  applicationStatus: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'COMPLETED' | 'DISPUTED';
  coverLetter?: string;
  appliedAt: Date;
  shortlistedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Hire Types
export interface IHire {
  id: string;
  jobId: string;
  malikId: string;
  karigarId: string;
  hireStatus: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'PAYMENT_PENDING';
  agreedPrice: number;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  latitude?: number;
  longitude?: number;
  isLocationTracking: boolean;
  arrivedAt?: Date;
  completedAt?: Date;
  completionPhotoUrls: string[];
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface IPayment {
  id: string;
  hireId: string;
  payerId: string;
  payeeId: string;
  grossAmount: number;
  platformFee: number;
  karigarAmount: number;
  paymentStatus: 'PENDING' | 'ESCROW_DEPOSITED' | 'RELEASED_TO_KARIGAR' | 'REFUNDED' | 'DISPUTED' | 'PARTIALLY_RELEASED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayTransferId?: string;
  disputeRaisedAt?: Date;
  disputeReason?: string;
  disputeResolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface IChat {
  id: string;
  hireId: string;
  user1Id: string;
  user2Id: string;
  lastMessageAt?: Date;
  lastMessage?: string;
  isArchivedUser1: boolean;
  isArchivedUser2: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE' | 'SYSTEM';
  text?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  metadata?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Review Types
export interface IReview {
  id: string;
  hireId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

// KYC Types
export interface IKYCSubmission {
  id: string;
  userId: string;
  submissionStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED';
  aadhaarNumberEncrypted?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: string;
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  createdAt: Date;
}

// Request/Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthPayload {
  userId: string;
  role: string;
  sessionId: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter Types
export interface JobFilters {
  city?: string;
  state?: string;
  category?: string;
  trades?: string[];
  priceType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

export interface UserFilters {
  role?: string;
  isVerified?: boolean;
  city?: string;
  state?: string;
  minRating?: number;
}

export interface HireFilters {
  status?: string;
  malikId?: string;
  karigarId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentFilters {
  status?: string;
  payerId?: string;
  payeeId?: string;
  fromDate?: Date;
  toDate?: Date;
}
