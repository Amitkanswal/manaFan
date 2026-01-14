import { NextRequest, NextResponse } from 'next/server';
import { loginWithPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await loginWithPassword(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: result.message,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

