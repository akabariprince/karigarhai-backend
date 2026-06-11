import { prisma } from '../../config/database';
import { encryptData, decryptData } from '../../shared/utils/encrypt.util';
import { env } from '../../config/env';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import { FileUploadUtil } from '../../shared/utils/file-upload.util';
import {
  UpdateProfileInput,
  UpdateKarigarProfileInput,
  UpdateMalikProfileInput,
  UpdateFcmTokenInput,
} from './user.validator';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        karigarProfile: true,
        malikProfile: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');

    if (user.profile && user.profile.profilePhotoUrl) {
      user.profile.profilePhotoUrl = await FileUploadUtil.getSignedUrlIfNeeded(user.profile.profilePhotoUrl) || null;
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const { role, ...profileFields } = data;

    const profileData = await prisma.profile.upsert({
      where: { userId },
      update: profileFields,
      create: {
        userId,
        firstName: profileFields.firstName || 'User',
        city: profileFields.city || 'Unknown',
        state: profileFields.state || 'Unknown',
        pincode: profileFields.pincode || '000000',
        ...profileFields,
      },
    });

    const userUpdateData: any = { isProfileComplete: true };
    if (role) {
      userUpdateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      include: { profile: true },
    });

    if (updatedUser.profile && updatedUser.profile.profilePhotoUrl) {
      updatedUser.profile.profilePhotoUrl = await FileUploadUtil.getSignedUrlIfNeeded(updatedUser.profile.profilePhotoUrl) || null;
    }

    return updatedUser;
  }

  async getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { select: { firstName: true, lastName: true, profilePhotoUrl: true, city: true } },
        karigarProfile: { select: { bio: true, trades: true, averageRating: true, totalReviews: true } },
        reviews: { where: { toUserId: userId }, select: { rating: true, comment: true } },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    if (user.profile && user.profile.profilePhotoUrl) {
      user.profile.profilePhotoUrl = await FileUploadUtil.getSignedUrlIfNeeded(user.profile.profilePhotoUrl) || null;
    }

    return user;
  }

  async updateKarigarProfile(userId: string, data: UpdateKarigarProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    if (user.role !== 'KARIGAR') throw new ConflictError('User is not a Karigar');

    const karigarProfile = await prisma.karigarProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        trades: data.trades || [],
        ...data,
      },
    });

    return karigarProfile;
  }

  async updateMalikProfile(userId: string, data: UpdateMalikProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    if (user.role !== 'MALIK') throw new ConflictError('User is not a Malik');

    const malikProfile = await prisma.malikProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        businessName: data.businessName || 'Business',
        ...data,
      },
    });

    return malikProfile;
  }

  async updateFcmToken(userId: string, input: UpdateFcmTokenInput) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: input.fcmToken },
    });

    return { fcmToken: updated.fcmToken };
  }

  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        karigarProfile: true,
        malikProfile: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');

    let stats: any = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    };

    if (user.role === 'KARIGAR' && user.karigarProfile) {
      stats = {
        ...stats,
        totalJobs: user.karigarProfile.totalJobs,
        totalHires: user.karigarProfile.totalHires,
        totalEarnings: user.karigarProfile.totalEarnings,
        averageRating: user.karigarProfile.averageRating,
        totalReviews: user.karigarProfile.totalReviews,
      };
    } else if (user.role === 'MALIK' && user.malikProfile) {
      stats = {
        ...stats,
        totalJobs: user.malikProfile.totalJobs,
        totalHires: user.malikProfile.totalHires,
        totalSpent: user.malikProfile.totalSpent,
        averageRating: user.malikProfile.averageRating,
      };
    }

    return stats;
  }
}
