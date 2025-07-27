import Joi from 'joi';

// Custom email validation for stricter checks
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

export const signupSchema = Joi.object({
  email: emailValidation,
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  preferredPosition: Joi.string()
    .valid('goalkeeper', 'defender', 'midfielder', 'forward', 'any')
    .default('any'),
});

export const loginSchema = Joi.object({
  email: emailValidation,
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  email: emailValidation,
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
  preferredPosition: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward', 'any').optional(),
});

export const uploadAvatarSchema = Joi.object({
  file: Joi.any().required().messages({
    'any.required': 'Profile picture file is required',
  }),
});
