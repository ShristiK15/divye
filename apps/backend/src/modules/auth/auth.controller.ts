import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { successResponse } from '../../utils/response';
import { authService } from './auth.service';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.types';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export const register = async (
  req: Request<Record<string, never>, unknown, RegisterDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json(
      successResponse(
        { accessToken: result.accessToken, user: result.user },
        'Registration successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<Record<string, never>, unknown, LoginDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json(
      successResponse(
        { accessToken: result.accessToken, user: result.user },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json(successResponse(null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token required', code: 'UNAUTHORIZED', statusCode: 401 });
      return;
    }

    const result = await authService.refresh(refreshToken);
    res.status(200).json(successResponse(result, 'Token refreshed'));
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request<Record<string, never>, unknown, VerifyEmailDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.verifyEmail(req.body);
    res.status(200).json(successResponse(result, 'Email verified successfully'));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request<Record<string, never>, unknown, ForgotPasswordDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.forgotPassword(req.body);
    res.status(200).json(
      successResponse(null, 'If the email exists, a reset OTP has been sent')
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request<Record<string, never>, unknown, ResetPasswordDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.resetPassword(req.body);
    res.status(200).json(successResponse(null, 'Password reset successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.getMe(req.user!.id);
    res.status(200).json(successResponse(result, 'User profile retrieved'));
  } catch (error) {
    next(error);
  }
};
