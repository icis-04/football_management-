import Joi from 'joi';

// Custom email validation for stricter checks (same as in auth.ts)
const emailValidation = Joi.string()
  .email({ tlds: { allow: true } })
  .required()
  .custom((value, helpers) => {
    // Additional email validation rules
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(value)) {
      return helpers.error('string.email');
    }
    
    // Check for common invalid patterns
    const invalidPatterns = [
      /\.{2,}/, // Multiple dots in a row
      /@.*@/, // Multiple @ symbols
      /^\./, // Starts with dot
      /\.$/, // Ends with dot
      /@\./, // @ followed by dot
      /\.@/, // Dot followed by @
    ];
    
    if (invalidPatterns.some(pattern => pattern.test(value))) {
      return helpers.error('string.email');
    }
    
    // Ensure email has a valid domain extension
    const parts = value.split('@');
    if (parts.length !== 2) {
      return helpers.error('string.email');
    }
    
    const domain = parts[1];
    if (!domain.includes('.') || domain.split('.').pop()!.length < 2) {
      return helpers.error('string.email');
    }
    
    return value.toLowerCase(); // Normalize email to lowercase
  }, 'email validation')
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

export const addAllowedEmailSchema = Joi.object({
  email: emailValidation
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