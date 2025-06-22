import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'string.empty': 'Name cannot be empty'
    }),
  
  preferredPosition: Joi.string()
    .valid('goalkeeper', 'defender', 'midfielder', 'forward', 'any')
    .messages({
      'any.only': 'Preferred position must be one of: goalkeeper, defender, midfielder, forward, any'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
}); 