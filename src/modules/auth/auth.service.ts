import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import {
  hashOtp,
  verifyOtpHash,
  generateOtp,
} from '../../shared/utils/encrypt.util';
import {
  AuthError,
  ConflictError,
  RateLimitError,
  ValidationError,
} from '../../shared/errors/AppError';
import { CheckUserInput, SendOtpInput, VerifyOtpInput, RefreshTokenInput, AdminLoginInput, ChangePasswordInput } from './auth.validator';
import { sendWhatsappOtp } from '../../shared/utils/whatsapp.util';

export class AuthService {
  async checkUser(input: CheckUserInput): Promise<{
    exists: boolean;
    role?: string;
    isProfileComplete?: boolean;
    isVerified?: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      isVerified: user.isVerified,
    };
  }

  async sendOtp(input: SendOtpInput): Promise<{ message: string }> {
    const purpose = input.purpose || 'SIGNUP';
    const existingOtpLog = await prisma.otpLog.findFirst({
      where: {
        phone: input.phone,
        purpose: purpose as any,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtpLog) {
      const recentSends = await prisma.otpLog.count({
        where: {
          phone: input.phone,
          purpose: purpose as any,
          createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) },
        },
      });

      if (recentSends >= 3) {
        throw new RateLimitError('Maximum OTP attempts reached. Try again in 15 minutes.');
      }
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpLog.create({
      data: {
        phone: input.phone,
        hashedOtp,
        purpose: purpose as any,
        expiresAt,
        ipAddress: '0.0.0.0',
      },
    });

    // Send OTP via WhatsApp Cloud API
    try {
      await sendWhatsappOtp(input.phone, otp);
      console.log(`WhatsApp OTP (${purpose}) sent successfully to ${input.phone}`);
    } catch (error: any) {
      console.error('Failed to send WhatsApp OTP:', error?.response?.data || error?.message || error);
      if (env.NODE_ENV === 'production') {
        throw new Error('Failed to send verification code. Please try again.');
      }
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(input: VerifyOtpInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      userId: string;
      phone: string;
      role: string;
      isProfileComplete: boolean;
      isVerified: boolean;
    };
    isNewUser: boolean;
    kycStatus: string | null;
  }> {
    const purpose = input.purpose || 'SIGNUP';
    const otpLog = await prisma.otpLog.findFirst({
      where: {
        phone: input.phone,
        purpose: purpose as any,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpLog) {
      throw new AuthError('OTP not found or expired');
    }

    if (otpLog.expiresAt < new Date()) {
      throw new AuthError('OTP has expired');
    }

    if (otpLog.lockedUntil && otpLog.lockedUntil > new Date()) {
      throw new RateLimitError('Too many failed attempts. Try again later.');
    }

    if (otpLog.attempts >= 5) {
      await prisma.otpLog.update({
        where: { id: otpLog.id },
        data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
      });
      throw new RateLimitError('Too many failed attempts. Try again in 15 minutes.');
    }

    if (!verifyOtpHash(input.otp, otpLog.hashedOtp)) {
      await prisma.otpLog.update({
        where: { id: otpLog.id },
        data: { attempts: otpLog.attempts + 1 },
      });
      throw new ValidationError('Invalid OTP');
    }

    await prisma.otpLog.update({
      where: { id: otpLog.id },
      data: { verified: true },
    });

    let user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          phone: input.phone,
          role: input.role || 'KARIGAR',
          isPhoneVerified: true,
        },
      });
    }

    let kycStatus: string | null = null;
    if (user.role === 'KARIGAR') {
      const latestKyc = await prisma.kYCSubmission.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      kycStatus = latestKyc ? latestKyc.submissionStatus : null;
    }

    const sessionId = randomUUID();
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId,
      },
      env.JWT_ACCESS_SECRET as string,
      { expiresIn: env.JWT_ACCESS_EXPIRES as any }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId,
      },
      env.JWT_REFRESH_SECRET as string,
      { expiresIn: env.JWT_REFRESH_EXPIRES as any }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        deviceId: input.deviceId,
        deviceType: input.deviceType,
        ipAddress: '0.0.0.0',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        isVerified: user.isVerified,
      },
      isNewUser,
      kycStatus,
    };
  }

  async refreshToken(input: RefreshTokenInput): Promise<{ accessToken: string }> {
    try {
      const payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        role: string;
        sessionId: string;
      };

      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.revokedAt) {
        throw new AuthError('Session revoked or not found');
      }

      const isValidToken = await bcrypt.compare(input.refreshToken, session.refreshTokenHash);

      if (!isValidToken) {
        throw new AuthError('Invalid refresh token');
      }

      const accessToken = jwt.sign(
        {
          userId: payload.userId,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        env.JWT_ACCESS_SECRET as string,
        { expiresIn: env.JWT_ACCESS_EXPIRES as any }
      );

      return { accessToken };
    } catch (error) {
      throw new AuthError('Invalid or expired refresh token');
    }
  }

  async logout(sessionId: string): Promise<{ message: string }> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out successfully' };
  }

  async adminLogin(input: AdminLoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      userId: string;
      phone: string;
      role: string;
    };
  }> {
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    if (user.role !== 'ADMIN') {
      throw new AuthError('Access denied: User is not an administrator');
    }

    if (!user.passwordHash) {
      throw new AuthError('Admin password is not set. Contact system administrator.');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('Invalid credentials');
    }

    const sessionId = randomUUID();
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId,
      },
      env.JWT_ACCESS_SECRET as string,
      { expiresIn: env.JWT_ACCESS_EXPIRES as any }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId,
      },
      env.JWT_REFRESH_SECRET as string,
      { expiresIn: env.JWT_REFRESH_EXPIRES as any }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        deviceId: input.deviceId,
        deviceType: input.deviceType,
        ipAddress: '0.0.0.0',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    if (!user.passwordHash) {
      throw new AuthError('Password is not configured for this account');
    }

    const isValidPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new ValidationError('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedNewPassword,
      },
    });

    return { message: 'Password changed successfully' };
  }
}
