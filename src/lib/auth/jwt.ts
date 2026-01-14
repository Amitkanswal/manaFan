import jwt, { Secret } from 'jsonwebtoken';
import { JWTPayload } from './types';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  // Use the older API that accepts string for expiresIn
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(): Date {
  // Parse JWT_EXPIRES_IN format (e.g., '7d', '24h', '60m')
  const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}

