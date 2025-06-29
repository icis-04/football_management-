import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../types';
import { createApiResponse, transformUserWithFullUrls } from '../utils';
import { logger } from '../config/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, preferredPosition } = req.body;
      const result = await this.authService.signup(email, password, name, preferredPosition);

      res.status(201).json(createApiResponse(true, {
        user: transformUserWithFullUrls(result.user, req),
        tokens: result.tokens,
      }, 'User registered successfully'));
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'EMAIL_NOT_ALLOWED') {
        res.status(400).json(createApiResponse(false, undefined, undefined, {
          code: 'AUTH_EMAIL_NOT_ALLOWED',
          message: 'Email is not in the allowed list. Please contact an administrator.',
        }));
        return;
      }

      if (errorMessage === 'USER_ALREADY_EXISTS') {
        res.status(409).json(createApiResponse(false, undefined, undefined, {
          code: 'AUTH_USER_EXISTS',
          message: 'User with this email already exists',
        }));
        return;
      }

      logger.error('Signup error', { error: errorMessage });
      res.status(500).json(createApiResponse(false, undefined, undefined, {
        code: 'AUTH_SIGNUP_FAILED',
        message: 'Registration failed. Please try again.',
      }));
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.json(createApiResponse(true, {
        user: transformUserWithFullUrls(result.user, req),
        tokens: result.tokens,
      }, 'Login successful'));
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'INVALID_CREDENTIALS') {
        res.status(401).json(createApiResponse(false, undefined, undefined, {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        }));
        return;
      }

      logger.error('Login error', { error: errorMessage });
      res.status(500).json(createApiResponse(false, undefined, undefined, {
        code: 'AUTH_LOGIN_FAILED',
        message: 'Login failed. Please try again.',
      }));
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);

      res.json(createApiResponse(true, { tokens }, 'Token refreshed successfully'));
    } catch (error) {
      res.status(401).json(createApiResponse(false, undefined, undefined, {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Refresh token is invalid or expired',
      }));
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query as { email: string };
      const isAllowed = await this.authService.validateAllowedEmail(email);

      res.json(createApiResponse(true, { isAllowed }, 'Email verification completed'));
    } catch (error) {
      logger.error('Email verification error', { error: (error as Error).message });
      res.status(500).json(createApiResponse(false, undefined, undefined, {
        code: 'EMAIL_VERIFICATION_FAILED',
        message: 'Email verification failed',
      }));
    }
  };

  logout = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.json(createApiResponse(true, undefined, 'Logout successful'));
  };

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.authService.getUserById(req.user!.userId);

      if (!user) {
        res.status(404).json(createApiResponse(false, undefined, undefined, {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        }));
        return;
      }

      res.json(createApiResponse(true, { user: transformUserWithFullUrls(user, req) }, 'Profile retrieved successfully'));
    } catch (error) {
      logger.error('Get profile error', { error: (error as Error).message });
      res.status(500).json(createApiResponse(false, undefined, undefined, {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to retrieve profile',
      }));
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, preferredPosition } = req.body;
      const userId = req.user!.userId;

      const updatedUser = await this.authService.updateProfile(userId, {
        name,
        preferredPosition,
      });

      res.json(createApiResponse(true, { user: transformUserWithFullUrls(updatedUser, req) }, 'Profile updated successfully'));
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'USER_NOT_FOUND') {
        res.status(404).json(createApiResponse(false, undefined, undefined, {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        }));
        return;
      }

      logger.error('Update profile error', { error: errorMessage });
      res.status(500).json(createApiResponse(false, undefined, undefined, {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'Failed to update profile',
      }));
    }
  };
} 