import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, AdminLoginDto } from '../dto/auth.dto';

/**
 * Attaches the session cookie to a successful auth response.
 *
 * Previously the token was only written client-side by js-cookie after the
 * fetch resolved, so `middleware.ts` — which reads `auth_token` off the
 * request — had nothing to read until that write happened to land. Setting it
 * on the response makes the session exist as soon as login succeeds.
 *
 * Not HttpOnly: AuthContext and the profile page read this cookie from JS.
 */
function withAuthCookie(response: NextResponse, request: NextRequest, token: string): NextResponse {
  response.cookies.set('auth_token', token, {
    httpOnly: false,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days, matching the JWT lifetime
  });
  return response;
}

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

      const response = NextResponse.json(result, {
        status: result.success ? 201 : 400
      });
      return result.success && result.token
        ? withAuthCookie(response, request, result.token)
        : response;
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

      const response = NextResponse.json(result, {
        status: result.success ? 200 : 401
      });
      return result.success && result.token
        ? withAuthCookie(response, request, result.token)
        : response;
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

      const response = NextResponse.json(result, {
        status: result.success ? 200 : 401
      });
      return result.success && result.token
        ? withAuthCookie(response, request, result.token)
        : response;
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
