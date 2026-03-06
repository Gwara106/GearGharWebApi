/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User interface for API responses
 */
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  image?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Users list response with pagination
 */
export type UsersResponse = PaginatedResponse<User>;

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation interface
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}
