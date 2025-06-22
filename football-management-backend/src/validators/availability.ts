import Joi from 'joi';

export const submitAvailabilitySchema = Joi.object({
  matchDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Match date must be in YYYY-MM-DD format',
      'any.required': 'Match date is required',
    }),
  isAvailable: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Availability status is required',
    }),
});

export const getAvailabilitySchema = Joi.object({
  matchDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Match date must be in YYYY-MM-DD format',
      'any.required': 'Match date is required',
    }),
});

export const updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Availability status is required',
    }),
});

export const matchDateParamSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required',
    }),
}); 