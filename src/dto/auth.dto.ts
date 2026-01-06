import { z } from 'zod';

// Base validation schemas
const emailSchema = z.string().email('Please enter a valid email address').toLowerCase();
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters long');

// Register DTO
export const RegisterDto = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters long')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters long')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
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
    email: z.string(),
    role: z.enum(['user', 'admin']),
    status: z.enum(['active', 'inactive']),
    createdAt: z.date(),
    updatedAt: z.date()
  }).optional(),
  admin: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.literal('admin'),
    status: z.enum(['active', 'inactive']),
    createdAt: z.date(),
    updatedAt: z.date()
  }).optional()
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
export type AdminLoginInput = z.infer<typeof AdminLoginDto>;
export type AuthResponse = z.infer<typeof AuthResponseDto>;
