import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Webhook to sync/update manga stats when manga is published/updated in Contentstack
 * This can be triggered by Contentstack Automate when manga entries are modified
 * 
 * Expected payload:
 * {
 *   "event": "publish" | "update",
 *   "content_type": "manga",
 *   "entry": {
 *     "uid": "manga-uid",
 *     "title": "Manga Title",
 *     "url": "manga-slug"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Only process manga content type
    if (payload.content_type !== 'manga') {
      return NextResponse.json({
        message: 'Event ignored - not manga content type',
      });
    }

    const entry = payload.entry;
    if (!entry) {
      return NextResponse.json(
        { error: 'No entry data in payload' },
        { status: 400 }
      );
    }

    const mangaUid = entry.uid;
    const mangaSlug = entry.url || mangaUid;

    // Ensure manga stats entry exists
    await prisma.mangaStats.upsert({
      where: { mangaUid },
      create: {
        mangaUid,
        mangaSlug,
        totalViews: 0,
        uniqueViewers: 0,
        avgRating: 0,
        totalRatings: 0,
        totalBookmarks: 0,
        totalSubscribers: 0,
      },
      update: {
        mangaSlug, // Update slug if changed
      },
    });

    return NextResponse.json({
      message: 'Manga stats initialized/updated',
      mangaUid,
      mangaSlug,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

