import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { AppDataSource } from '../config/database';
import { config } from '../config/environment';
import { AuthTokens, JWTPayload } from '../types';
import { logger } from '../config/logger';

export class AuthService {
  private userRepository: Repository<User>;
  private allowedEmailRepository: Repository<AllowedEmail>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.allowedEmailRepository = AppDataSource.getRepository(AllowedEmail);
  }

  /**
   * Register a new user
   */
  async signup(
    email: string,
    password: string,
    name: string,
    preferredPosition: string = 'any'
  ): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Check if email is allowed
      const allowedEmail = await this.allowedEmailRepository.findOne({
        where: { email: email.toLowerCase(), used: false },
      });

      if (!allowedEmail) {
        throw new Error('EMAIL_NOT_ALLOWED');
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error('USER_ALREADY_EXISTS');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = this.userRepository.create({
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        preferred_position: preferredPosition,
        is_admin: false,
        is_active: true,
      });

      const savedUser = await this.userRepository.save(user);

      // Mark email as used
      allowedEmail.used = true;
      await this.allowedEmailRepository.save(allowedEmail);

      // Generate tokens
      const tokens = this.generateTokens(savedUser);

      logger.info('User registered successfully', {
        userId: savedUser.id,
        email: savedUser.email,
      });

      // Return user without password
      const userResponse = savedUser.toProfile();
      return { user: userResponse, tokens };
    } catch (error) {
      logger.error('Signup failed', { email, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Find user
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.is_active || !(await bcrypt.compare(password, user.password))) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      // Return user without password
      const userResponse = user.toProfile();
      return { user: userResponse, tokens };
    } catch (error) {
      logger.error('Login failed', { email, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JWTPayload;

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user || !user.is_active) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      logger.info('Token refreshed successfully', { userId: user.id });

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed', { error: (error as Error).message });
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Validate if email is allowed for registration
   */
  async validateAllowedEmail(email: string): Promise<boolean> {
    try {
      const allowedEmail = await this.allowedEmailRepository.findOne({
        where: { email: email.toLowerCase(), used: false },
      });

      return !!allowedEmail;
    } catch (error) {
      logger.error('Email validation failed', { email, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<any | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_active: true },
      });

      if (user) {
        return user.toProfile();
      }

      return null;
    } catch (error) {
      logger.error('Get user by ID failed', { userId, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updates: { name?: string; preferredPosition?: string }
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_active: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Update fields
      if (updates.name) {
        user.name = updates.name;
      }
      if (updates.preferredPosition) {
        user.preferred_position = updates.preferredPosition;
      }

      const updatedUser = await this.userRepository.save(user);

      logger.info('User profile updated', { userId, updates });

      return updatedUser.toProfile();
    } catch (error) {
      logger.error('Profile update failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    };

    return {
      accessToken: jwt.sign(payload, config.JWT_SECRET, { expiresIn: '15m' }),
      refreshToken: jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
    };
  }
} 