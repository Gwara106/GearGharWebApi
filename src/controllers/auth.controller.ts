import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, AdminLoginDto } from '../dto/auth.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register user controller
   */
  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate request body using DTO
      const validation = RegisterDto.safeParse(body);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: errorMessages
          },
          { status: 400 }
        );
      }

      // Call service layer
      const result = await this.authService.registerUser(validation.data);

      return NextResponse.json(result, {
        status: result.success ? 201 : 400
      });
    } catch (error) {
      console.error('Register controller error:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Internal server error'
        },
        { status: 500 }
      );
    }
  }

  /**
   * Login user controller
   */
  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate request body using DTO
      const validation = LoginDto.safeParse(body);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: errorMessages
          },
          { status: 400 }
        );
      }

      // Call service layer
      const result = await this.authService.loginUser(validation.data);

      return NextResponse.json(result, {
        status: result.success ? 200 : 401
      });
    } catch (error) {
      console.error('Login controller error:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Internal server error'
        },
        { status: 500 }
      );
    }
  }

  /**
   * Admin login controller
   */
  async adminLogin(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate request body using DTO
      const validation = AdminLoginDto.safeParse(body);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: errorMessages
          },
          { status: 400 }
        );
      }

      // Call service layer
      const result = await this.authService.loginAdmin(validation.data);

      return NextResponse.json(result, {
        status: result.success ? 200 : 401
      });
    } catch (error) {
      console.error('Admin login controller error:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Internal server error'
        },
        { status: 500 }
      );
    }
  }
}
