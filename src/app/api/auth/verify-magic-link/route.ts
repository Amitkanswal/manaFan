import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// GET - for email link clicks (redirects to app with token)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_link`);
  }

  const result = await verifyMagicLink(token);

  if (!result.success) {
    return NextResponse.redirect(`${APP_URL}/login?error=expired_link`);
  }

  // Redirect to app with the session token
  // The frontend will store this token and complete the login
  return NextResponse.redirect(`${APP_URL}/login?token=${result.token}`);
}

// POST - for manual token verification (API call)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const result = await verifyMagicLink(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

