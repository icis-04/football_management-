import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { config } from '../config/environment';

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let errorCode = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid input data';
  } else if (error.name === 'UnauthorizedError' || error.message.includes('jwt')) {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = 'Resource conflict';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    errorCode = 'TOO_MANY_REQUESTS';
    message = 'Rate limit exceeded';
  }

  // Handle multer errors
  if (error.message === 'Only JPEG and PNG images are allowed') {
    statusCode = 400;
    errorCode = 'INVALID_FILE_TYPE';
    message = 'Only JPEG and PNG images are allowed';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    errorCode = 'FILE_TOO_LARGE';
    message = 'File size exceeds maximum allowed size';
  }

  // Handle database errors
  if (error.name === 'QueryFailedError') {
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = config.NODE_ENV === 'production' ? 'Database operation failed' : error.message;
  }

  // Don't expose internal errors in production
  if (config.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details: config.NODE_ENV === 'development' ? error.details : undefined,
      timestamp: new Date().toISOString()
    }
  });
}; 