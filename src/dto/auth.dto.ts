import { z } from 'zod';

// Base validation schemas
const emailSchema = z.string().email('Please enter a valid email address').toLowerCase();
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters long');

// Register DTO
export const RegisterDto = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters long')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .optional(), // Make optional for mobile compatibility
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters long')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .optional(), // Make optional for mobile compatibility
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(), // For mobile app compatibility
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(), // For mobile app compatibility
  phoneNumber: z.string()
    .regex(/^[+]?[\d\s\-()]+$/, 'Please enter a valid phone number')
    .optional(), // For mobile app compatibility
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }).optional() // Make optional for mobile compatibility
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => {
  // Ensure either firstName+lastName or name is provided
  return ((data.firstName && data.lastName) || data.name);
}, {
  message: 'Either first name and last name, or full name must be provided',
  path: ['firstName']
});

// Login DTO
export const LoginDto = z.object({
  email: emailSchema,
  password: passwordSchema
});

// Admin Login DTO (same as login but with additional validation in service)
export const AdminLoginDto = z.object({
  email: emailSchema,
  password: passwordSchema
});

// Response DTOs
export const AuthResponseDto = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string().optional(),
  user: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    name: z.string().optional(), // For mobile compatibility
    email: z.string(),
    username: z.string().optional(), // For mobile compatibility
    phoneNumber: z.string().optional(), // For mobile compatibility
    profilePicture: z.string().optional(), // For mobile compatibility
    role: z.enum(['user', 'admin']),
    status: z.enum(['active', 'inactive']),
    lastLogin: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
  }).optional(),
  admin: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    name: z.string().optional(), // For mobile compatibility
    email: z.string(),
    username: z.string().optional(), // For mobile compatibility
    phoneNumber: z.string().optional(), // For mobile compatibility
    profilePicture: z.string().optional(), // For mobile compatibility
    role: z.literal('admin'),
    status: z.enum(['active', 'inactive']),
    lastLogin: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
  }).optional()
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
export type AdminLoginInput = z.infer<typeof AdminLoginDto>;
export type AuthResponse = z.infer<typeof AuthResponseDto>;
