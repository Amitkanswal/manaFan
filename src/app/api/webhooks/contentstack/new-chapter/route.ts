import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { sendNewChapterNotification } from '@/lib/auth/email';

const WEBHOOK_SECRET = process.env.CONTENTSTACK_WEBHOOK_SECRET || '';

/**
 * Verify webhook signature from Contentstack
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('CONTENTSTACK_WEBHOOK_SECRET not set, skipping signature verification');
    return true; // Allow in development without secret
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const expectedSignature = hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Webhook endpoint for Contentstack Automate
 * 
 * This is triggered when a new chapter (manga_list) is published.
 * It sends email notifications to all users subscribed to that manga.
 * 
 * Expected payload from Contentstack:
 * {
 *   "event": "publish",
 *   "content_type": "manga_list",
 *   "entry": {
 *     "uid": "chapter-uid",
 *     "title": "Chapter 150",
 *     "url": "manga-slug/chapter-150",
 *     "managa": [{ "uid": "manga-uid", ... }]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-contentstack-signature') || '';

    // Verify webhook signature
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    
    // Only process publish events for manga_list (chapters)
    if (payload.event !== 'publish' || payload.content_type !== 'manga_list') {
      return NextResponse.json({
        message: 'Event ignored',
        event: payload.event,
        contentType: payload.content_type,
      });
    }

    const entry = payload.entry;
    if (!entry) {
      return NextResponse.json(
        { error: 'No entry data in payload' },
        { status: 400 }
      );
    }

    // Extract chapter and manga info
    const chapterUid = entry.uid;
    const chapterTitle = entry.title || 'New Chapter';
    const chapterUrl = entry.url || '';
    const chapterSlug = chapterUrl.split('/').pop() || chapterUid;
    
    // Get manga reference (note: typo in schema is "managa")
    const mangaRef = entry.managa?.[0] || entry.manga?.[0];
    if (!mangaRef) {
      return NextResponse.json({
        message: 'No manga reference found, skipping notifications',
      });
    }

    const mangaUid = mangaRef.uid;
    const mangaTitle = mangaRef.title || 'Unknown Manga';
    const mangaSlug = chapterUrl.split('/')[0] || mangaUid;

    console.log(`Processing new chapter notification for ${mangaTitle} - ${chapterTitle}`);

    // Find all users subscribed to this manga with notifications enabled
    const subscriptions = await prisma.subscription.findMany({
      where: {
        mangaUid,
        notifyNewChapter: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailUpdatesOptIn: true,
          },
        },
      },
    });

    // Filter to users who have email updates enabled
    const eligibleSubscriptions = subscriptions.filter(
      sub => sub.user.emailUpdatesOptIn
    );

    console.log(`Found ${eligibleSubscriptions.length} subscribers to notify`);

    // Send notifications in batches
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < eligibleSubscriptions.length; i += batchSize) {
      const batch = eligibleSubscriptions.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const sent = await sendNewChapterNotification(
            sub.user.email,
            sub.user.name,
            mangaTitle,
            mangaSlug,
            chapterTitle,
            chapterSlug
          );

          // Log notification
          await prisma.notificationLog.create({
            data: {
              userId: sub.user.id,
              mangaUid,
              chapterUid,
              chapterTitle,
              status: sent ? 'sent' : 'failed',
              errorMessage: sent ? null : 'Failed to send email',
            },
          });

          return sent;
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          failCount++;
        }
      });
    }

    console.log(`Notification results: ${successCount} sent, ${failCount} failed`);

    return NextResponse.json({
      message: 'Notifications processed',
      manga: mangaTitle,
      chapter: chapterTitle,
      notificationsSent: successCount,
      notificationsFailed: failCount,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Contentstack-Signature',
    },
  });
}

