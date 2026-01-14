import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET - Get manga statistics (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mangaUid: string }> }
) {
  try {
    const { mangaUid } = await params;

    const stats = await prisma.mangaStats.findUnique({
      where: { mangaUid },
    });

    if (!stats) {
      return NextResponse.json({
        mangaUid,
        totalViews: 0,
        uniqueViewers: 0,
        avgRating: 0,
        totalRatings: 0,
        totalBookmarks: 0,
        totalSubscribers: 0,
      });
    }

    return NextResponse.json({
      mangaUid: stats.mangaUid,
      totalViews: stats.totalViews,
      uniqueViewers: stats.uniqueViewers,
      avgRating: stats.avgRating,
      totalRatings: stats.totalRatings,
      totalBookmarks: stats.totalBookmarks,
      totalSubscribers: stats.totalSubscribers,
    });
  } catch (error) {
    console.error('Get manga stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

