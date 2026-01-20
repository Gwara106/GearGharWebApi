import { Response } from 'express';

// Server-side cookie configuration
const SERVER_COOKIE_CONFIG = {
  token: {
    name: 'auth_token',
    options: {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    },
  },
  user: {
    name: 'user_data',
    options: {
      httpOnly: false, // Allow client-side access for user data
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    },
  },
};

// Set token cookie (server-side)
export const setTokenCookieServer = (res: Response, token: string) => {
  res.cookie(SERVER_COOKIE_CONFIG.token.name, token, SERVER_COOKIE_CONFIG.token.options);
};

// Set user data cookie (server-side)
export const setUserCookieServer = (res: Response, user: any) => {
  res.cookie(SERVER_COOKIE_CONFIG.user.name, JSON.stringify(user), SERVER_COOKIE_CONFIG.user.options);
};

// Clear auth cookies (server-side)
export const clearAuthCookiesServer = (res: Response) => {
  res.clearCookie(SERVER_COOKIE_CONFIG.token.name, { path: '/' });
  res.clearCookie(SERVER_COOKIE_CONFIG.user.name, { path: '/' });
};
