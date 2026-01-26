import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthContext, requireAuth } from '@/lib/api/middleware';

// GET - Get all subscriptions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: context.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Subscribe to a manga for new chapter notifications
export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    const authError = requireAuth(context);
    if (authError) return authError;

    const body = await request.json();
    const { mangaUid, mangaSlug, mangaTitle, notifyNewChapter = true } = body;

    if (!mangaUid || !mangaSlug || !mangaTitle) {
      return NextResponse.json(
        { error: 'mangaUid, mangaSlug, and mangaTitle are required' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
      where: {
        userId_mangaUid: {
          userId: context.user!.id,
          mangaUid,
        },
      },
    });

    if (existing) {
      // Update notification preference
      const subscription = await prisma.subscription.update({
        where: { id: existing.id },
        data: { notifyNewChapter },
      });

      return NextResponse.json({
        message: 'Subscription updated successfully',
        subscription,
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: context.user!.id,
        mangaUid,
        mangaSlug,
        mangaTitle,
        notifyNewChapter,
      },
    });

    // Update manga stats
    await prisma.mangaStats.upsert({
      where: { mangaUid },
      create: {
        mangaUid,
        mangaSlug,
        totalSubscribers: 1,
      },
      update: {
        totalSubscribers: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: 'Subscribed successfully! You will receive email notifications for new chapters.',
      subscription,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from a manga
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

    const deleted = await prisma.subscription.deleteMany({
      where: {
        userId: context.user!.id,
        mangaUid,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update manga stats
    await prisma.mangaStats.update({
      where: { mangaUid },
      data: {
        totalSubscribers: { decrement: 1 },
      },
    }).catch(() => {});

    return NextResponse.json({
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

