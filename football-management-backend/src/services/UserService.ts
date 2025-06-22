import { Repository } from 'typeorm';
import { User } from '../models/User';
import { AppDataSource } from '../config/database';
import { logger } from '../config/logger';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllActivePlayers(): Promise<any[]> {
    try {
      const users = await this.userRepository.find({
        where: { is_active: true },
        select: ['id', 'name', 'email', 'preferred_position', 'profile_pic_url'],
        order: { name: 'ASC' },
      });

      return users;
    } catch (error) {
      logger.error('Failed to get active players', { error: (error as Error).message });
      throw error;
    }
  }

  async getUserProfile(userId: number): Promise<any | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_active: true },
        select: ['id', 'name', 'email', 'preferred_position', 'profile_pic_url', 'is_admin', 'created_at'],
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user profile', { userId, error: (error as Error).message });
      return null;
    }
  }

  async updateUserProfile(userId: number, updateData: { name?: string; preferred_position?: string }): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_active: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (updateData.name) {
        user.name = updateData.name;
      }

      if (updateData.preferred_position) {
        user.preferred_position = updateData.preferred_position as 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';
      }

      user.updated_at = new Date();
      const updatedUser = await this.userRepository.save(user);

      logger.info('User profile updated', { userId, updateData });

      // Return user without password
      return updatedUser.toProfile();
    } catch (error) {
      logger.error('Failed to update user profile', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async updateProfilePicture(userId: number, profilePicUrl: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_active: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      user.profile_pic_url = profilePicUrl;
      user.updated_at = new Date();
      const updatedUser = await this.userRepository.save(user);

      logger.info('Profile picture updated', { userId, profilePicUrl });

      return updatedUser.toProfile();
    } catch (error) {
      logger.error('Failed to update profile picture', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async removeProfilePicture(userId: number): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_active: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      user.profile_pic_url = undefined;
      user.updated_at = new Date();
      const updatedUser = await this.userRepository.save(user);

      logger.info('Profile picture removed', { userId });

      return updatedUser.toProfile();
    } catch (error) {
      logger.error('Failed to remove profile picture', { userId, error: (error as Error).message });
      throw error;
    }
  }
}
