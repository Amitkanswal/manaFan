import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthContext } from '@/lib/api/middleware';

// POST - Track a view (works for both guests and authenticated users)
export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    const body = await request.json();
    const { mangaUid, mangaSlug, chapterUid, chapterSlug } = body;

    if (!mangaUid || !mangaSlug) {
      return NextResponse.json(
        { error: 'mangaUid and mangaSlug are required' },
        { status: 400 }
      );
    }

    // Create view record
    await prisma.viewHistory.create({
      data: {
        userId: context.user?.id || null,
        sessionId: context.guestSessionId,
        mangaUid,
        mangaSlug,
        chapterUid: chapterUid || null,
        chapterSlug: chapterSlug || null,
      },
    });

    // Update manga stats (increment views)
    await prisma.mangaStats.upsert({
      where: { mangaUid },
      create: {
        mangaUid,
        mangaSlug,
        totalViews: 1,
        uniqueViewers: 1,
      },
      update: {
        totalViews: { increment: 1 },
      },
    });

    // Set guest session cookie if needed
    const response = NextResponse.json({
      message: 'View tracked',
    });

    if (!context.isAuthenticated && context.guestSessionId) {
      response.cookies.set('mangafan_guest_session', context.guestSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get view history for authenticated user
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);

    if (!context.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required to view history' },
        { status: 401 }
      );
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const history = await prisma.viewHistory.findMany({
      where: { userId: context.user!.id },
      orderBy: { viewedAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      distinct: ['mangaUid', 'chapterUid'],
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get view history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

