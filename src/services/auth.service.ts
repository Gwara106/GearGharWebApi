import { IUserRepository } from '../repositories/user.repository';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, comparePasswords, generateToken } from '../../lib/auth';
import { RegisterInput, LoginInput, AdminLoginInput, AuthResponse } from '../dto/auth.dto';

export interface IAuthService {
  registerUser(userData: RegisterInput): Promise<AuthResponse>;
  loginUser(loginData: LoginInput): Promise<AuthResponse>;
  loginAdmin(adminData: AdminLoginInput): Promise<AuthResponse>;
}

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async registerUser(userData: RegisterInput): Promise<AuthResponse> {
    try {
      // Check if email already exists
      const emailExists = await this.userRepository.emailExists(userData.email);
      if (emailExists) {
        return {
          success: false,
          message: 'Email already registered'
        };
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user object
      const newUser = {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: 'user' as const,
        status: 'active' as const
      };

      // Save user to database
      const createdUser = await this.userRepository.create(newUser);

      // Generate JWT token
      const token = generateToken(
        createdUser._id.toString(),
        createdUser.email,
        createdUser.role
      );

      return {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          _id: createdUser._id.toString(),
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          email: createdUser.email,
          role: createdUser.role,
          status: createdUser.status,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error && error.message === 'Email already exists') {
        return {
          success: false,
          message: 'Email already registered'
        };
      }

      return {
        success: false,
        message: 'An error occurred during registration'
      };
    }
  }

  /**
   * Login user
   */
  async loginUser(loginData: LoginInput): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(loginData.email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (user.status === 'inactive') {
        return {
          success: false,
          message: 'Account is inactive. Please contact support.'
        };
      }

      // Verify password
      const isValidPassword = await comparePasswords(loginData.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Update last login
      await this.userRepository.updateLastLogin(user._id.toString());

      // Generate JWT token
      const token = generateToken(
        user._id.toString(),
        user.email,
        user.role
      );

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  /**
   * Login admin
   */
  async loginAdmin(adminData: AdminLoginInput): Promise<AuthResponse> {
    try {
      // Find user by email
      const admin = await this.userRepository.findByEmail(adminData.email);
      if (!admin) {
        return {
          success: false,
          message: 'Invalid admin credentials'
        };
      }

      // Check if user has admin role
      if (admin.role !== 'admin') {
        return {
          success: false,
          message: 'Invalid admin credentials'
        };
      }

      // Check if admin is active
      if (admin.status === 'inactive') {
        return {
          success: false,
          message: 'Admin account is inactive'
        };
      }

      // Verify password
      const isValidPassword = await comparePasswords(adminData.password, admin.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid admin credentials'
        };
      }

      // Update last login
      await this.userRepository.updateLastLogin(admin._id.toString());

      // Generate JWT token
      const token = generateToken(
        admin._id.toString(),
        admin.email,
        admin.role
      );

      return {
        success: true,
        message: 'Admin login successful',
        token,
        admin: {
          _id: admin._id.toString(),
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: 'An error occurred during admin login'
      };
    }
  }
}
