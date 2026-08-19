'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { setTokenCookie, getTokenCookie, setUserCookie, getUserCookie, clearAuthCookies } from '../../lib/cookies';

/**
 * Mirrors the User model. Field names deliberately match the backend so the
 * client is not translating between `phone`/`phoneNumber` or
 * `image`/`avatar`/`profilePicture` — divergence there is what let mock data
 * masquerade as real data.
 */
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  /** Model field is `phoneNumber`; `phone` is a legacy alias, read-only. */
  phoneNumber?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  /** Legacy alias some older pages still read. Not written by the backend. */
  image?: string;
}

/**
 * Identities that a previous build's mock profile endpoint wrote into the
 * `user` cookie. A cookie carrying one of these is not a real session, so it is
 * discarded on load rather than being displayed as the signed-in user.
 */
const KNOWN_MOCK_IDS = ['1', '2'];

function isMockUser(user: any): boolean {
  if (!user) return true;
  if (KNOWN_MOCK_IDS.includes(String(user._id))) return true;
  // A real _id is a 24-character Mongo ObjectId hex string.
  return !/^[0-9a-fA-F]{24}$/.test(String(user._id || ''));
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Merges a partial server payload into the current user. */
  updateUser: (user: Partial<User>) => void;
  /** Re-reads the signed-in user from the database. */
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const storedToken = getTokenCookie();
    const storedUser = getUserCookie();

    if (storedToken && storedUser) {
      // Reject a cookie left behind by the old mock profile endpoint. Without
      // this, `_id: '1'` persists forever and every call to /api/auth/:id 403s
      // because the JWT carries the real Mongo id.
      if (isMockUser(storedUser)) {
        console.warn('[auth] Discarding stale mock user cookie:', storedUser?._id);
        clearAuthCookies();
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, user: User) => {
    setToken(token);
    setUser(user);
    setTokenCookie(token);
    setUserCookie(user);
  }, []);

  /**
   * Merges a server response into the current user.
   *
   * Guards against a partial or mock payload replacing a valid session: a
   * response without a real ObjectId `_id` is ignored rather than persisted.
   * The previous implementation replaced the user wholesale, which is how the
   * mock profile response became the app-wide identity.
   */
  const updateUser = useCallback((updatedUser: Partial<User>) => {
    if (isMockUser(updatedUser)) {
      console.warn('[auth] Ignoring updateUser payload without a valid _id:', updatedUser);
      return;
    }
    setUser((current) => {
      const merged = { ...(current || {}), ...updatedUser } as User;
      setUserCookie(merged);
      return merged;
    });
  }, []);

  /**
   * Reconciles the cached cookie user with the database.
   *
   * Both profile pages had their fetch removed ("disabled to prevent infinite
   * loops"), which meant nothing ever corrected a stale or wrong cookie. This
   * lives in the provider and takes no reactive dependencies, so callers can
   * invoke it from a mount-only effect without re-triggering themselves.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.user && !isMockUser(data.user)) {
        setUser(data.user);
        setUserCookie(data.user);
      }
    } catch {
      // Offline or transient failure — keep showing the cached user.
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    clearAuthCookies();
  }, []);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const isAuthenticated = useCallback(() => {
    return !!user && !!token;
  }, [user, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
        isAdmin,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
