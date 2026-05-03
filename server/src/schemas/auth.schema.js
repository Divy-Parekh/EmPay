const { z } = require('zod');

const signupSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

const loginSchema = z.object({
  login_id: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => data.login_id || data.email, {
  message: 'Login ID or email is required',
  path: ['login_id'],
});

const changePasswordSchema = z.object({
  old_password: z.string().optional(),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string(),
  user_id: z.string().uuid().optional(), // For admin changing someone else's password
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

module.exports = { signupSchema, loginSchema, changePasswordSchema };
