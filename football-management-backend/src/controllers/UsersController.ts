import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { createApiResponse, createErrorResponse } from '../utils';
import { processImage, cleanupOldAvatar, deleteFile } from '../middlewares/upload';
import path from 'path';
import { config } from '../config/environment';
import { AuthenticatedRequest } from '../types';

export class UsersController {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Get current user profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'name', 'preferred_position', 'profile_pic_url', 'is_admin', 'is_active', 'created_at', 'updated_at']
      });

      if (!user) {
        res.status(404).json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      res.json(createApiResponse(true, user, 'Profile retrieved successfully'));
    } catch (error) {
      logger.error('Error getting user profile:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get profile'));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const { name, preferredPosition } = req.body;

      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      // Update fields if provided
      if (name !== undefined) {
        user.name = name;
      }
      if (preferredPosition !== undefined) {
        user.preferred_position = preferredPosition;
      }

      user.updated_at = new Date();
      await this.userRepository.save(user);

      // Return updated user without password
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'name', 'preferred_position', 'profile_pic_url', 'is_admin', 'is_active', 'created_at', 'updated_at']
      });

      res.json(createApiResponse(true, updatedUser, 'Profile updated successfully'));
    } catch (error) {
      logger.error('Error updating user profile:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to update profile'));
    }
  }

  /**
   * Upload profile picture
   */
  async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json(createErrorResponse('NO_FILE', 'No file uploaded'));
        return;
      }

      const userId = req.user.userId;

      // Get current user to check for existing avatar
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      // Clean up old avatar first
      await cleanupOldAvatar(req, res, () => {});

      // Process the image
      await processImage(req, res, () => {});

      if (!req.processedFile) {
        res.status(500).json(createErrorResponse('PROCESSING_FAILED', 'Failed to process image'));
        return;
      }

      // Update user's profile picture URL
      user.profile_pic_url = req.processedFile.url;
      user.updated_at = new Date();
      await this.userRepository.save(user);

      logger.info(`Avatar uploaded for user ${userId}: ${req.processedFile.filename}`);
      
      res.json(createApiResponse(true, {
        profilePicUrl: req.processedFile.url
      }, 'Profile picture uploaded successfully'));
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      
      // Clean up uploaded file if processing failed
      if (req.processedFile) {
        await deleteFile(req.processedFile.filepath);
      }
      
      res.status(500).json(createErrorResponse('UPLOAD_FAILED', 'Failed to upload profile picture'));
    }
  }

  /**
   * Remove profile picture
   */
  async removeAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;

      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      if (!user.profile_pic_url) {
        res.status(400).json(createErrorResponse('NO_AVATAR', 'No profile picture to remove'));
        return;
      }

      // Delete the file
      const filename = path.basename(user.profile_pic_url);
      const filepath = path.join(config.UPLOAD_PATH, filename);
      await deleteFile(filepath);

      // Update user record
      user.profile_pic_url = undefined;
      user.updated_at = new Date();
      await this.userRepository.save(user);

      logger.info(`Avatar removed for user ${userId}`);
      
      res.json(createApiResponse(true, undefined, 'Profile picture removed successfully'));
    } catch (error) {
      logger.error('Error removing avatar:', error);
      res.status(500).json(createErrorResponse('REMOVAL_FAILED', 'Failed to remove profile picture'));
    }
  }

  /**
   * Get list of all active players (non-admin view)
   */
  async getPlayers(_req: Request, res: Response): Promise<void> {
    try {
      const players = await this.userRepository.find({
        where: { 
          is_active: true,
          is_admin: false 
        },
        select: ['id', 'name', 'preferred_position', 'profile_pic_url'],
        order: { name: 'ASC' }
      });

      res.json(createApiResponse(true, players, 'Players retrieved successfully'));
    } catch (error) {
      logger.error('Error getting players:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get players'));
    }
  }
} 