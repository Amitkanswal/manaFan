"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { secureStorage } from '@/lib/auth/crypto';
import { v4 as uuidv4 } from 'uuid';

// Types
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailUpdatesOptIn: boolean;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  guestSessionId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  // Auth actions
  register: (email: string, password?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Profile actions
  updateProfile: (data: { name?: string; emailUpdatesOptIn?: boolean }) => Promise<{ success: boolean; error?: string }>;
  
  // Utility
  refreshUser: () => Promise<void>;
  requireAuth: (redirectUrl?: string) => boolean;
  
  // Redirect helpers
  setRedirectUrl: (url: string) => void;
  getRedirectUrl: () => string | null;
  clearRedirectUrl: () => void;
}

const AUTH_TOKEN_KEY = 'mangafan_auth_token';
const GUEST_SESSION_KEY = 'mangafan_guest_session';
const REDIRECT_URL_KEY = 'mangafan_redirect_url';

const AuthContext = createContext<AuthContextValue | null>(null);

// Get or create guest session ID (stored in localStorage, not sensitive)
function getGuestSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
  if (!sessionId) {
    sessionId = `guest_${uuidv4()}`;
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    guestSessionId: '',
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from encrypted session storage
  useEffect(() => {
    const initAuth = async () => {
      const guestSessionId = getGuestSessionId();
      
      // Get encrypted token from session storage
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

      if (token) {
        // Validate token with server
        const response = await authApi.getMe(token);
        if (response.data?.user) {
          setState({
            user: response.data.user,
            token,
            guestSessionId,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
        // Token invalid, clear it
        secureStorage.removeItem(AUTH_TOKEN_KEY);
      }

      setState({
        user: null,
        token: null,
        guestSessionId,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    initAuth();
  }, []);

  // Check for magic link token in URL (after redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token && window.location.pathname === '/login') {
      // Store encrypted token and fetch user
      secureStorage.setItem(AUTH_TOKEN_KEY, token).then(() => {
        authApi.getMe(token).then((response) => {
          if (response.data?.user) {
            setState(prev => ({
              ...prev,
              user: response.data!.user,
              token,
              isAuthenticated: true,
              isLoading: false,
            }));
            
            // Check for redirect URL
            const redirectUrl = sessionStorage.getItem(REDIRECT_URL_KEY);
            sessionStorage.removeItem(REDIRECT_URL_KEY);
            
            // Redirect to saved URL or home
            router.push(redirectUrl || '/');
          }
        });
      });
    }
  }, [router]);

  // Store token securely
  const storeToken = useCallback(async (token: string) => {
    await secureStorage.setItem(AUTH_TOKEN_KEY, token);
  }, []);

  // Register
  const register = useCallback(async (
    email: string,
    password?: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await authApi.register(email, password, name);
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data?.token) {
      await storeToken(response.data.token);
      setState(prev => ({
        ...prev,
        user: response.data!.user,
        token: response.data!.token,
        isAuthenticated: true,
      }));
    }

    return { success: true };
  }, [storeToken]);

  // Login with password
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await authApi.login(email, password);
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data?.token) {
      await storeToken(response.data.token);
      setState(prev => ({
        ...prev,
        user: response.data!.user,
        token: response.data!.token,
        isAuthenticated: true,
      }));
    }

    return { success: true };
  }, [storeToken]);

  // Request magic link
  const requestMagicLink = useCallback(async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await authApi.requestMagicLink(email);
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    if (state.token) {
      await authApi.logout(state.token);
    }
    
    secureStorage.removeItem(AUTH_TOKEN_KEY);
    
    setState(prev => ({
      ...prev,
      user: null,
      token: null,
      isAuthenticated: false,
    }));
  }, [state.token]);

  // Update profile
  const updateProfile = useCallback(async (
    data: { name?: string; emailUpdatesOptIn?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!state.token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await authApi.updateProfile(state.token, data);
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data?.user) {
      setState(prev => ({
        ...prev,
        user: response.data!.user,
      }));
    }

    return { success: true };
  }, [state.token]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    const response = await authApi.getMe(state.token);
    if (response.data?.user) {
      setState(prev => ({
        ...prev,
        user: response.data!.user,
      }));
    }
  }, [state.token]);

  // Set redirect URL for after login
  const setRedirectUrl = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(REDIRECT_URL_KEY, url);
    }
  }, []);

  // Get redirect URL
  const getRedirectUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REDIRECT_URL_KEY);
  }, []);

  // Clear redirect URL
  const clearRedirectUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(REDIRECT_URL_KEY);
    }
  }, []);

  // Check if authenticated, redirect to login if not
  const requireAuth = useCallback((redirectUrl?: string): boolean => {
    if (state.isAuthenticated) return true;
    
    // Store redirect URL and navigate to login
    if (typeof window !== 'undefined' && redirectUrl) {
      sessionStorage.setItem(REDIRECT_URL_KEY, redirectUrl);
      router.push('/login');
    }
    
    return false;
  }, [state.isAuthenticated, router]);

  const contextValue = useMemo<AuthContextValue>(() => ({
    ...state,
    register,
    login,
    requestMagicLink,
    logout,
    updateProfile,
    refreshUser,
    requireAuth,
    setRedirectUrl,
    getRedirectUrl,
    clearRedirectUrl,
  }), [
    state,
    register,
    login,
    requestMagicLink,
    logout,
    updateProfile,
    refreshUser,
    requireAuth,
    setRedirectUrl,
    getRedirectUrl,
    clearRedirectUrl,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Default safe values for SSR/build time
const DEFAULT_AUTH_CONTEXT: AuthContextValue = {
  user: null,
  token: null,
  guestSessionId: '',
  isAuthenticated: false,
  isLoading: true,
  register: async () => ({ success: false, error: 'Not initialized' }),
  login: async () => ({ success: false, error: 'Not initialized' }),
  requestMagicLink: async () => ({ success: false, error: 'Not initialized' }),
  logout: async () => {},
  updateProfile: async () => ({ success: false, error: 'Not initialized' }),
  refreshUser: async () => {},
  requireAuth: () => false,
  setRedirectUrl: () => {},
  getRedirectUrl: () => null,
  clearRedirectUrl: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  // Return default safe values if context is not available (SSR/build)
  if (!context) {
    return DEFAULT_AUTH_CONTEXT;
  }
  return context;
}

// Convenience hooks
export function useAuthUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading };
}

export function useRequireAuth() {
  const { isAuthenticated, requireAuth } = useAuth();
  return { isAuthenticated, requireAuth };
}
