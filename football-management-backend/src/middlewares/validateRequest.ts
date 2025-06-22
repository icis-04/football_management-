import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiResponse } from '../utils';

/**
 * Generic validation middleware that can validate different parts of the request
 */
export const validateRequest = (
  schema: Joi.ObjectSchema,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = target === 'body' ? req.body : 
                          target === 'query' ? req.query : 
                          req.params;

    const { error, value } = schema.validate(dataToValidate, {
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
          message: `${target.charAt(0).toUpperCase() + target.slice(1)} validation failed`,
          details: { errors: validationErrors },
        })
      );
      return;
    }

    // Replace the target with validated and sanitized data
    if (target === 'body') {
      req.body = value;
    } else if (target === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
};
