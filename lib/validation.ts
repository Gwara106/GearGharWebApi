// Re-export DTOs for backward compatibility
export { 
  RegisterDto as registerSchema, 
  LoginDto as loginSchema, 
  AdminLoginDto as adminLoginSchema
} from '@/src/dto/auth.dto';

export type { 
  RegisterInput,
  LoginInput,
  AdminLoginInput
} from '@/src/dto/auth.dto';

// Keep product schema for now
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  image: z.string().url('Invalid image URL'),
});

export type ProductInput = z.infer<typeof productSchema>;
