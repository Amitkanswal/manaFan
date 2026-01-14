// Authentication types

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailUpdatesOptIn: boolean;
  createdAt: Date;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
}

export interface GuestSession {
  sessionId: string;
  createdAt: string;
}

export type AuthMode = 'guest' | 'authenticated';

export interface AuthState {
  mode: AuthMode;
  user: AuthUser | null;
  token: string | null;
  guestSessionId: string | null;
  isLoading: boolean;
}

