import { NextRequest } from 'next/server';
import { validateSession, createGuestSessionId } from '@/lib/auth';
import { AuthUser } from '@/lib/auth/types';

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  guestSessionId: string | null;
}

const GUEST_SESSION_COOKIE = 'mangafan_guest_session';

/**
 * Extract auth context from request
 * Works for both authenticated users and guests
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Try to validate JWT token
  if (token) {
    const user = await validateSession(token);
    if (user) {
      return {
        user,
        isAuthenticated: true,
        guestSessionId: null,
      };
    }
  }

  // Fall back to guest session
  let guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE)?.value || null;
  
  // Generate new guest session if not exists
  if (!guestSessionId) {
    guestSessionId = createGuestSessionId();
  }

  return {
    user: null,
    isAuthenticated: false,
    guestSessionId,
  };
}

/**
 * Require authentication - returns error response if not authenticated
 */
export function requireAuth(context: AuthContext): Response | null {
  if (!context.isAuthenticated) {
    return Response.json(
      { error: 'Authentication required. Please log in to continue.' },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}

