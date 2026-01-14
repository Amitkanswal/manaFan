import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthContext, requireAuth } from '@/lib/api/middleware';

// GET - Get reading progress for authenticated user
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const mangaUid = request.nextUrl.searchParams.get('mangaUid');

    if (mangaUid) {
      // Get specific progress
      const progress = await prisma.readingProgress.findUnique({
        where: {
          userId_mangaUid: {
            userId: context.user!.id,
            mangaUid,
          },
        },
      });

      return NextResponse.json({ progress });
    }

    // Get all progress
    const progress = await prisma.readingProgress.findMany({
      where: { userId: context.user!.id },
      orderBy: { lastReadAt: 'desc' },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get reading progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update reading progress
export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const body = await request.json();
    const {
      mangaUid,
      mangaSlug,
      mangaTitle,
      mangaCover,
      chapterUid,
      chapterSlug,
      chapterNumber,
      chapterTitle,
      totalChapters,
    } = body;

    if (!mangaUid || !mangaSlug || !mangaTitle || !chapterUid || !chapterSlug || chapterNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing progress
    const existing = await prisma.readingProgress.findUnique({
      where: {
        userId_mangaUid: {
          userId: context.user!.id,
          mangaUid,
        },
      },
    });

    // Only update if reading a higher chapter number (or no previous progress)
    if (existing && existing.lastChapterNumber >= chapterNumber) {
      return NextResponse.json({
        message: 'Progress already up to date',
        progress: existing,
      });
    }

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_mangaUid: {
          userId: context.user!.id,
          mangaUid,
        },
      },
      create: {
        userId: context.user!.id,
        mangaUid,
        mangaSlug,
        mangaTitle,
        mangaCover,
        lastChapterUid: chapterUid,
        lastChapterSlug: chapterSlug,
        lastChapterNumber: chapterNumber,
        lastChapterTitle: chapterTitle || `Chapter ${chapterNumber}`,
        totalChapters: totalChapters || 0,
      },
      update: {
        mangaSlug,
        mangaTitle,
        mangaCover,
        lastChapterUid: chapterUid,
        lastChapterSlug: chapterSlug,
        lastChapterNumber: chapterNumber,
        lastChapterTitle: chapterTitle || `Chapter ${chapterNumber}`,
        totalChapters: totalChapters || existing?.totalChapters || 0,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Progress saved',
      progress,
    });
  } catch (error) {
    console.error('Update reading progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

