import Joi, { ObjectSchema } from 'joi';

const signupSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Username must be a string',
    'string.empty': 'Username cannot be empty',
    'string.min': 'Username must be at least 4 characters long',
    'string.max': 'Username must be at most 12 characters long'
  }),
  password: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field'
  }),
  country: Joi.string().required().messages({
    'string.base': 'Country must be of type string',
    'string.empty': 'Country is a required field'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email is a required field'
  }),
  profilePicture: Joi.string().required().messages({
    'string.base': 'Please add a profile picture',
    'string.email': 'Profile picture is required',
    'string.empty': 'Profile picture is required'
  }),
  browserName: Joi.string().optional(),
  deviceType: Joi.string().optional()
});

export { signupSchema };
