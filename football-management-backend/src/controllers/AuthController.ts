import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../types';
import { createApiResponse, transformUserWithFullUrls } from '../utils';
import { logger } from '../config/logger';
import { AllowedEmail } from '../models/AllowedEmail';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

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

  // Temporary endpoint to create admin - REMOVE AFTER USE
  async createAdminTemp(req: Request, res: Response): Promise<void> {
    try {
      const { secret } = req.body;
      
      // Simple secret check
      if (secret !== 'temp-admin-setup-2024') {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const adminEmail = 'c.iwuchukwu@yahoo.com';
      const adminPassword = 'iwuchukwu';

      // Get repositories
      const userRepo = AppDataSource.getRepository(User);
      const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);

      // Check if admin already exists
      let adminUser = await userRepo.findOne({
        where: { email: adminEmail }
      });

      if (adminUser) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser.password = hashedPassword;
        adminUser.is_admin = true;
        adminUser.is_active = true;
        await userRepo.save(adminUser);
        logger.info('Admin password updated');
      } else {
        // Create admin user first
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser = userRepo.create({
          email: adminEmail,
          password: hashedPassword,
          name: 'C. Iwuchukwu',
          preferred_position: 'any' as any,
          is_admin: true,
          is_active: true
        });
        adminUser = await userRepo.save(adminUser);
        logger.info('Admin user created');
      }

      // Check if email is in allowed list
      const existingAllowedEmail = await allowedEmailRepo.findOne({
        where: { email: adminEmail }
      });

      if (!existingAllowedEmail) {
        const anyAdmin = await userRepo.findOne({
          where: { is_admin: true }
        });

        if (anyAdmin) {
          const newAllowedEmail = allowedEmailRepo.create({
            email: adminEmail,
            added_by_admin_id: anyAdmin.id,
            used: true
          });
          await allowedEmailRepo.save(newAllowedEmail);
          logger.info('Added email to allowed list');
        }
      } else {
        existingAllowedEmail.used = true;
        await allowedEmailRepo.save(existingAllowedEmail);
        logger.info('Updated allowed email status');
      }

      res.json({ 
        message: 'Admin setup complete!',
        email: adminEmail
      });
    } catch (error) {
      logger.error('Failed to create admin:', error);
      res.status(500).json({ error: 'Failed to create admin' });
    }
  }

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