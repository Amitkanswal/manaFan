import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAuth } from '@/lib/api/middleware';
import { updateUserProfile } from '@/lib/auth';

// GET - Get current user profile
export async function GET(request: NextRequest) {
  const context = await getAuthContext(request);
  
  const authError = requireAuth(context);
  if (authError) return authError;

  return NextResponse.json({
    user: context.user,
  });
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const body = await request.json();
    const { name, avatarUrl, emailUpdatesOptIn } = body;

    const updatedUser = await updateUserProfile(context.user!.id, {
      name,
      avatarUrl,
      emailUpdatesOptIn,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

