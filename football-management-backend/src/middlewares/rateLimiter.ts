import rateLimit from 'express-rate-limit';
import { config, isDevelopment } from '../config/environment';
import { logger } from '../config/logger';

// Global rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: config.RATE_LIMIT_MAX_REQUESTS, // 10000 requests per window default
  skip: () => isDevelopment(), // Skip rate limiting in development
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_AUTH_MAX_REQUESTS, // 500 requests per window default
  skip: () => isDevelopment(), // Skip rate limiting in development
  message: {
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many authentication attempts, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      error: {
        code: 'TOO_MANY_AUTH_ATTEMPTS',
        message: 'Too many authentication attempts, please try again later',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Admin endpoints rate limiter
export const adminRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS * 2, // Double the normal limit for admin
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many admin requests, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user?.userId
    });
    
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many admin requests, please try again later',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// File upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: 1000, // 1000 uploads per window for development
  message: {
    error: {
      code: 'TOO_MANY_UPLOADS',
      message: 'Too many file uploads, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    });
    
    res.status(429).json({
      error: {
        code: 'TOO_MANY_UPLOADS',
        message: 'Too many file uploads, please try again later',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export const rateLimiter = {
  global: globalRateLimiter,
  auth: authRateLimiter,
  admin: adminRateLimiter,
  upload: uploadRateLimiter
}; 