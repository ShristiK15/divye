import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@divye/database';
import { env } from '../../config/env';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { notificationService } from '../notifications/notification.service';
import type {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SafeUser,
  VerifyEmailDto,
} from './auth.types';
import { USER_SELECT } from './auth.types';

const BCRYPT_ROUNDS = 12;
const EMAIL_TOKEN_EXPIRY_HOURS = 24;
const OTP_EXPIRY_MINUTES = 15;

function generateRefreshTokenValue(): string {
  return crypto.randomBytes(64).toString('hex');
}

function generateEmailToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function signAccessToken(user: SafeUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
}

function parseRefreshExpiry(): Date {
  const days = parseInt(env.JWT_REFRESH_EXPIRY.replace('d', ''), 10) || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export const authService = {
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new AppError('Email already registered', 409, ErrorCodes.CONFLICT);
    }

    if (dto.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existingPhone) {
        throw new AppError('Phone number already registered', 409, ErrorCodes.CONFLICT);
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
      },
      select: USER_SELECT,
    });

    const emailToken = generateEmailToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_TOKEN_EXPIRY_HOURS);
    await prisma.emailVerificationToken.create({
      data: { token: emailToken, userId: user.id, expiresAt },
    });

    notificationService.sendEmailVerification(user, emailToken).catch((err: unknown) => {
      // fire-and-forget
    });

    const { accessToken, refreshToken } = await this.createSession(user);
    return { accessToken, user, refreshToken };
  },

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...USER_SELECT, passwordHash: true },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, ErrorCodes.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401, ErrorCodes.UNAUTHORIZED);
    }

    const { passwordHash: _, ...safeUser } = user;
    const { accessToken, refreshToken } = await this.createSession(safeUser);
    return { accessToken, user: safeUser, refreshToken };
  },

  async createSession(user: SafeUser): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = generateRefreshTokenValue();
    const expiresAt = parseRefreshExpiry();

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    const accessToken = signAccessToken(user);
    return { accessToken, refreshToken };
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: USER_SELECT } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new AppError('Invalid or expired refresh token', 401, ErrorCodes.UNAUTHORIZED);
    }

    const accessToken = signAccessToken(stored.user);
    return { accessToken };
  },

  async verifyEmail(dto: VerifyEmailDto): Promise<SafeUser> {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token: dto.token },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      }
      throw new AppError('Invalid or expired verification token', 400, ErrorCodes.BAD_REQUEST);
    }

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
        select: USER_SELECT,
      });

      await tx.emailVerificationToken.delete({ where: { id: record.id } });
      return updatedUser;
    });

    return user;
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: USER_SELECT,
    });

    if (!user) {
      return;
    }

    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await prisma.passwordResetOtp.upsert({
      where: { email: dto.email },
      create: { email: dto.email, otp, expiresAt },
      update: { otp, expiresAt },
    });

    notificationService.sendPasswordReset(user, otp).catch(() => {});
  },

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await prisma.passwordResetOtp.findUnique({
      where: { email: dto.email },
    });

    if (!record || record.expiresAt < new Date() || record.otp !== dto.otp) {
      throw new AppError('Invalid or expired OTP', 400, ErrorCodes.BAD_REQUEST);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });

    await prisma.refreshToken.deleteMany({
      where: { user: { email: dto.email } },
    });

    await prisma.passwordResetOtp.delete({
      where: { id: record.id },
    });
  },

  async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    return user;
  },
};
