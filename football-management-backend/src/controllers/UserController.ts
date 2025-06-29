import { Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthenticatedRequest } from '../types/auth';
import { createApiResponse, transformUserWithFullUrls } from '../utils';
import { logger } from '../config/logger';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Configure multer for file uploads
  private upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  getUploadMiddleware = () => this.upload.single('avatar');

  getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.getUserProfile(userId);

      if (!user) {
        res.status(404).json(
          createApiResponse(false, undefined, undefined, {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          })
        );
        return;
      }

      res.json(createApiResponse(true, { user: transformUserWithFullUrls(user, req) }));
    } catch (error) {
      logger.error('Get user profile failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile',
        })
      );
    }
  };

  updateMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { name, preferredPosition } = req.body;

      const updatedUser = await this.userService.updateUserProfile(userId, {
        name,
        preferred_position: preferredPosition,
      });

      res.json(createApiResponse(true, { user: transformUserWithFullUrls(updatedUser, req) }, 'Profile updated successfully'));
    } catch (error) {
      if ((error as Error).message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createApiResponse(false, undefined, undefined, {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          })
        );
        return;
      }

      logger.error('Update user profile failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
        })
      );
    }
  };

  uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded',
          })
        );
        return;
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      // Process image with Sharp
      await sharp(req.file.buffer)
        .resize(500, 500, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      // Update user profile with new avatar URL
      const avatarUrl = `/uploads/avatars/${filename}`;
      const updatedUser = await this.userService.updateProfilePicture(userId, avatarUrl);

      // Return full URL for the frontend
      const fullUrl = `${req.protocol}://${req.get('host')}${avatarUrl}`;

      res.json(createApiResponse(true, { 
        user: transformUserWithFullUrls(updatedUser, req),
        profilePicUrl: fullUrl 
      }, 'Avatar uploaded successfully'));
    } catch (error) {
      if ((error as Error).message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createApiResponse(false, undefined, undefined, {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          })
        );
        return;
      }

      logger.error('Upload avatar failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload avatar',
        })
      );
    }
  };

  removeAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      // Get current user to check if they have an avatar
      const currentUser = await this.userService.getUserProfile(userId);
      if (!currentUser) {
        res.status(404).json(
          createApiResponse(false, undefined, undefined, {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          })
        );
        return;
      }

      // Remove file from filesystem if exists
      if (currentUser.profile_pic_url) {
        const filename = path.basename(currentUser.profile_pic_url);
        const filepath = path.join(process.cwd(), 'uploads', 'avatars', filename);
        
        try {
          await fs.unlink(filepath);
        } catch (fileError) {
          // File might not exist, continue with database update
          logger.warn('Avatar file not found during removal', { filepath, userId });
        }
      }

      // Update user profile to remove avatar URL
      const updatedUser = await this.userService.removeProfilePicture(userId);

      res.json(createApiResponse(true, { user: transformUserWithFullUrls(updatedUser, req) }, 'Avatar removed successfully'));
    } catch (error) {
      if ((error as Error).message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createApiResponse(false, undefined, undefined, {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          })
        );
        return;
      }

      logger.error('Remove avatar failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove avatar',
        })
      );
    }
  };

  getPlayers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const players = await this.userService.getAllActivePlayers();
      const transformedPlayers = players.map(player => transformUserWithFullUrls(player, req));
      res.json(createApiResponse(true, { players: transformedPlayers }));
    } catch (error) {
      logger.error('Get players failed', { error: (error as Error).message });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get players',
        })
      );
    }
  };
} 