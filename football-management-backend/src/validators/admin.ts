import Joi from 'joi';

export const addAllowedEmailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const bulkAddAllowedEmailsSchema = Joi.object({
  emails: Joi.array()
    .items(Joi.string().email())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one email is required',
      'array.max': 'Cannot add more than 50 emails at once',
      'any.required': 'Emails array is required'
    })
});

export const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({
      'any.required': 'isActive status is required',
      'boolean.base': 'isActive must be true or false'
    })
});

export const auditLogQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 200',
      'number.integer': 'Limit must be an integer'
    })
}); 