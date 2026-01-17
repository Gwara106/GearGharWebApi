import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_CONFIG = {
  token: {
    name: 'auth_token',
    options: {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    },
  },
  user: {
    name: 'user_data',
    options: {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    },
  },
};

// Token management
export const setTokenCookie = (token: string) => {
  Cookies.set(COOKIE_CONFIG.token.name, token, COOKIE_CONFIG.token.options);
};

export const getTokenCookie = (): string | null => {
  return Cookies.get(COOKIE_CONFIG.token.name) || null;
};

export const removeTokenCookie = () => {
  Cookies.remove(COOKIE_CONFIG.token.name, { path: '/' });
};

// User data management
export const setUserCookie = (user: any) => {
  Cookies.set(COOKIE_CONFIG.user.name, JSON.stringify(user), COOKIE_CONFIG.user.options);
};

export const getUserCookie = (): any | null => {
  const userCookie = Cookies.get(COOKIE_CONFIG.user.name);
  if (!userCookie) return null;
  
  try {
    return JSON.parse(userCookie);
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    removeUserCookie();
    return null;
  }
};

export const removeUserCookie = () => {
  Cookies.remove(COOKIE_CONFIG.user.name, { path: '/' });
};

// Clear all auth cookies
export const clearAuthCookies = () => {
  removeTokenCookie();
  removeUserCookie();
};
