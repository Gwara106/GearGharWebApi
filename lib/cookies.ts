import Cookies from 'js-cookie';

/**
 * `secure` must track the actual connection, not the build mode. Deriving it
 * from NODE_ENV marked the cookie Secure in any production build, so a browser
 * talking to the app over plain HTTP silently discarded it: login returned 200,
 * nothing was stored, and the next navigation bounced back to the login page.
 */
const isSecureConnection = () =>
  typeof window !== 'undefined' && window.location.protocol === 'https:';

// `strict` withholds the cookie on the first top-level navigation that arrives
// from another site, which reads as a lost session. `lax` still blocks
// cross-site POSTs, which is the CSRF case that matters here.
const cookieOptions = () => ({
  expires: 7, // 7 days
  secure: isSecureConnection(),
  sameSite: 'lax' as const,
  path: '/',
});

// Cookie configuration
const COOKIE_CONFIG = {
  token: { name: 'auth_token' },
  user: { name: 'user_data' },
};

// Token management
export const setTokenCookie = (token: string) => {
  Cookies.set(COOKIE_CONFIG.token.name, token, cookieOptions());
};

export const getTokenCookie = (): string | null => {
  return Cookies.get(COOKIE_CONFIG.token.name) || null;
};

export const removeTokenCookie = () => {
  Cookies.remove(COOKIE_CONFIG.token.name, { path: '/' });
};

// User data management
export const setUserCookie = (user: any) => {
  Cookies.set(COOKIE_CONFIG.user.name, JSON.stringify(user), cookieOptions());
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
