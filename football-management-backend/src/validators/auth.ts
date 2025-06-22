import Joi from 'joi';

export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  preferredPosition: Joi.string()
    .valid('goalkeeper', 'defender', 'midfielder', 'forward', 'any')
    .default('any'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
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
