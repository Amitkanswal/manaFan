import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Secret for API authentication (use webhook secret or create a separate one)
const API_SECRET = process.env.CONTENTSTACK_WEBHOOK_SECRET || process.env.API_SECRET;

/**
 * GET /api/manga/[mangaUid]/subscribers
 * 
 * Returns list of subscriber emails for a given manga.
 * Can search by mangaUid or mangaSlug.
 * 
 * Query params:
 * - slug: (optional) Search by manga slug instead of UID
 * 
 * Headers:
 * - x-api-key: API secret for authentication
 * 
 * Response:
 * {
 *   mangaUid: string,
 *   mangaSlug: string,
 *   mangaTitle: string,
 *   totalSubscribers: number,
 *   subscribers: [
 *     { email: string, name: string | null, subscribedAt: string }
 *   ]
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mangaUid: string }> }
) {
  try {
    // Verify API key for security
    const apiKey = request.headers.get('x-api-key');
    if (API_SECRET && apiKey !== API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }

    const { mangaUid } = await params;
    const searchBySlug = request.nextUrl.searchParams.get('slug') === 'true';

    // Find subscriptions by mangaUid or mangaSlug
    const whereClause = searchBySlug
      ? { mangaSlug: mangaUid }
      : { mangaUid: mangaUid };

    const subscriptions = await prisma.subscription.findMany({
      where: {
        ...whereClause,
        notifyNewChapter: true, // Only get users who want notifications
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            emailUpdatesOptIn: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter to only users who have email updates enabled
    const eligibleSubscribers = subscriptions.filter(
      (sub) => sub.user.emailUpdatesOptIn
    );

    // Get manga info from first subscription (if any)
    const firstSub = subscriptions[0];

    return NextResponse.json({
      mangaUid: firstSub?.mangaUid || mangaUid,
      mangaSlug: firstSub?.mangaSlug || mangaUid,
      mangaTitle: firstSub?.mangaTitle || 'Unknown',
      totalSubscribers: eligibleSubscribers.length,
      subscribers: eligibleSubscribers.map((sub) => ({
        email: sub.user.email,
        name: sub.user.name,
        subscribedAt: sub.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manga/[mangaUid]/subscribers
 * 
 * Alternative endpoint that accepts manga name in body.
 * Useful when manga name contains special characters.
 * 
 * Body:
 * {
 *   mangaName?: string,  // Search by title (partial match)
 *   mangaSlug?: string,  // Search by slug (exact match)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mangaUid: string }> }
) {
  try {
    // Verify API key for security
    const apiKey = request.headers.get('x-api-key');
    if (API_SECRET && apiKey !== API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }

    const { mangaUid } = await params;
    const body = await request.json().catch(() => ({}));
    const { mangaName, mangaSlug } = body;

    // Build where clause based on provided params
    let whereClause: any = { notifyNewChapter: true };

    if (mangaName) {
      // Search by manga title (case-insensitive contains)
      whereClause.mangaTitle = {
        contains: mangaName,
      };
    } else if (mangaSlug) {
      whereClause.mangaSlug = mangaSlug;
    } else if (mangaUid && mangaUid !== 'search') {
      whereClause.mangaUid = mangaUid;
    } else {
      return NextResponse.json(
        { error: 'Please provide mangaName, mangaSlug, or mangaUid' },
        { status: 400 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            emailUpdatesOptIn: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter to only users who have email updates enabled
    const eligibleSubscribers = subscriptions.filter(
      (sub) => sub.user.emailUpdatesOptIn
    );

    // Get manga info from first subscription (if any)
    const firstSub = subscriptions[0];

    return NextResponse.json({
      mangaUid: firstSub?.mangaUid || mangaUid,
      mangaSlug: firstSub?.mangaSlug || mangaSlug || mangaUid,
      mangaTitle: firstSub?.mangaTitle || mangaName || 'Unknown',
      totalSubscribers: eligibleSubscribers.length,
      subscribers: eligibleSubscribers.map((sub) => ({
        email: sub.user.email,
        name: sub.user.name,
        subscribedAt: sub.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

