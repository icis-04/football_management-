import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiResponse } from '../utils';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json(
        createApiResponse(false, undefined, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: { errors: validationErrors },
        })
      );
      return;
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validation middleware for query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json(
        createApiResponse(false, undefined, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details: { errors: validationErrors },
        })
      );
      return;
    }

    // Replace req.query with validated and sanitized data
    req.query = value;
    next();
  };
};

/**
 * Validation middleware for route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json(
        createApiResponse(false, undefined, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Parameter validation failed',
          details: { errors: validationErrors },
        })
      );
      return;
    }

    // Replace req.params with validated and sanitized data
    req.params = value;
    next();
  };
}; 