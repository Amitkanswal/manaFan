import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthContext, requireAuth } from '@/lib/api/middleware';

// GET - Get user's rating for a manga or all ratings
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const mangaUid = request.nextUrl.searchParams.get('mangaUid');

    if (mangaUid) {
      // Get specific rating
      const rating = await prisma.rating.findUnique({
        where: {
          userId_mangaUid: {
            userId: context.user!.id,
            mangaUid,
          },
        },
      });

      return NextResponse.json({ rating: rating?.rating || null });
    }

    // Get all ratings
    const ratings = await prisma.rating.findMany({
      where: { userId: context.user!.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error('Get ratings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Rate a manga (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const body = await request.json();
    const { mangaUid, mangaSlug, rating } = body;

    if (!mangaUid || !mangaSlug || rating === undefined) {
      return NextResponse.json(
        { error: 'mangaUid, mangaSlug, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already rated
    const existing = await prisma.rating.findUnique({
      where: {
        userId_mangaUid: {
          userId: context.user!.id,
          mangaUid,
        },
      },
    });

    let userRating;

    if (existing) {
      // Update existing rating
      userRating = await prisma.rating.update({
        where: { id: existing.id },
        data: { rating },
      });
    } else {
      // Create new rating
      userRating = await prisma.rating.create({
        data: {
          userId: context.user!.id,
          mangaUid,
          mangaSlug,
          rating,
        },
      });
    }

    // Recalculate average rating for manga
    const avgResult = await prisma.rating.aggregate({
      where: { mangaUid },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.mangaStats.upsert({
      where: { mangaUid },
      create: {
        mangaUid,
        mangaSlug,
        avgRating: avgResult._avg.rating || 0,
        totalRatings: avgResult._count.rating,
      },
      update: {
        avgRating: avgResult._avg.rating || 0,
        totalRatings: avgResult._count.rating,
      },
    });

    return NextResponse.json({
      message: 'Rating saved successfully',
      rating: userRating,
      avgRating: avgResult._avg.rating || 0,
      totalRatings: avgResult._count.rating,
    });
  } catch (error) {
    console.error('Rate manga error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a rating
export async function DELETE(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const body = await request.json();
    const { mangaUid } = body;

    if (!mangaUid) {
      return NextResponse.json(
        { error: 'mangaUid is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.rating.deleteMany({
      where: {
        userId: context.user!.id,
        mangaUid,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    // Recalculate average rating
    const avgResult = await prisma.rating.aggregate({
      where: { mangaUid },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.mangaStats.update({
      where: { mangaUid },
      data: {
        avgRating: avgResult._avg.rating || 0,
        totalRatings: avgResult._count.rating,
      },
    }).catch(() => {});

    return NextResponse.json({
      message: 'Rating removed successfully',
    });
  } catch (error) {
    console.error('Remove rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

