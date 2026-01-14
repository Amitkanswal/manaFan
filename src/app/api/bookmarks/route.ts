import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthContext, requireAuth } from '@/lib/api/middleware';

// GET - Get all bookmarks for authenticated user
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: context.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a bookmark (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const body = await request.json();
    const { mangaUid, mangaSlug, mangaTitle, mangaCover } = body;

    if (!mangaUid || !mangaSlug || !mangaTitle) {
      return NextResponse.json(
        { error: 'mangaUid, mangaSlug, and mangaTitle are required' },
        { status: 400 }
      );
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_mangaUid: {
          userId: context.user!.id,
          mangaUid,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Manga is already bookmarked' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: context.user!.id,
        mangaUid,
        mangaSlug,
        mangaTitle,
        mangaCover,
      },
    });

    // Update manga stats
    await prisma.mangaStats.upsert({
      where: { mangaUid },
      create: {
        mangaUid,
        mangaSlug,
        totalBookmarks: 1,
      },
      update: {
        totalBookmarks: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: 'Bookmark added successfully',
      bookmark,
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a bookmark
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

    const deleted = await prisma.bookmark.deleteMany({
      where: {
        userId: context.user!.id,
        mangaUid,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    // Update manga stats
    await prisma.mangaStats.update({
      where: { mangaUid },
      data: {
        totalBookmarks: { decrement: 1 },
      },
    }).catch(() => {}); // Ignore if stats don't exist

    return NextResponse.json({
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

