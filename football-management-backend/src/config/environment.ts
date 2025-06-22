import dotenv from 'dotenv';
import { EnvironmentConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Validates and returns environment configuration
 */
const getEnvironmentConfig = (): EnvironmentConfig => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  // Check for required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  const config: EnvironmentConfig = {
    NODE_ENV: process.env['NODE_ENV'] || 'development',
    PORT: parseInt(process.env['PORT'] || '3000', 10),
    DATABASE_PATH: process.env['DATABASE_PATH'] || './data/football.db',
    JWT_SECRET: process.env['JWT_SECRET']!,
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET']!,
    UPLOAD_PATH: process.env['UPLOAD_PATH'] || './uploads',
    MAX_FILE_SIZE: parseInt(process.env['MAX_FILE_SIZE'] || '5242880', 10), // 5MB
    FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3001',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '10000', 10), // 10,000 requests
    RATE_LIMIT_AUTH_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_AUTH_MAX_REQUESTS'] || '500', 10), // 500 auth requests
    LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
    LOG_FILE: process.env['LOG_FILE'] || './logs/app.log',
    // Phase 6 - Email Configuration
    EMAIL_PORT: parseInt(process.env['EMAIL_PORT'] || '587', 10),
    EMAIL_SECURE: process.env['EMAIL_SECURE'] === 'true',
  };

  // Add optional email properties only if they exist
  if (process.env['EMAIL_HOST']) config.EMAIL_HOST = process.env['EMAIL_HOST'];
  if (process.env['EMAIL_USER']) config.EMAIL_USER = process.env['EMAIL_USER'];
  if (process.env['EMAIL_PASS']) config.EMAIL_PASS = process.env['EMAIL_PASS'];
  if (process.env['EMAIL_FROM'] || process.env['EMAIL_USER']) {
    config.EMAIL_FROM = process.env['EMAIL_FROM'] || process.env['EMAIL_USER'];
  }

  return config;
};

export const config = getEnvironmentConfig();

/**
 * Check if running in production environment
 */
export const isProduction = (): boolean => config.NODE_ENV === 'production';

/**
 * Check if running in development environment
 */
export const isDevelopment = (): boolean => config.NODE_ENV === 'development';

/**
 * Check if running in test environment
 */
export const isTest = (): boolean => config.NODE_ENV === 'test'; 