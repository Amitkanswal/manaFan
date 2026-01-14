import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Secret for API authentication
const API_SECRET = process.env.CONTENTSTACK_WEBHOOK_SECRET || process.env.API_SECRET;

/**
 * GET /api/subscribers?manga=<name|slug|uid>
 * 
 * Returns list of subscriber emails for a given manga.
 * Searches by manga title, slug, or UID.
 * 
 * Query params:
 * - manga: Manga name, slug, or UID to search for (required)
 * - exact: If "true", requires exact match on slug/uid (default: partial match on title)
 * 
 * Headers:
 * - x-api-key: API secret for authentication
 * 
 * Example:
 * GET /api/subscribers?manga=solo-leveling
 * GET /api/subscribers?manga=Solo%20Leveling
 * GET /api/subscribers?manga=m1&exact=true
 * 
 * Response:
 * {
 *   manga: string,
 *   mangaUid: string,
 *   mangaSlug: string,
 *   mangaTitle: string,
 *   totalSubscribers: number,
 *   subscribers: [
 *     { email: string, name: string | null, subscribedAt: string }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key for security
    const apiKey = request.headers.get('x-api-key');
    if (API_SECRET && apiKey !== API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }

    const manga = request.nextUrl.searchParams.get('manga');
    const exact = request.nextUrl.searchParams.get('exact') === 'true';

    if (!manga) {
      return NextResponse.json(
        { error: 'Missing required parameter: manga' },
        { status: 400 }
      );
    }

    // Build search conditions
    let subscriptions;

    if (exact) {
      // Exact match on UID or slug
      subscriptions = await prisma.subscription.findMany({
        where: {
          notifyNewChapter: true,
          OR: [
            { mangaUid: manga },
            { mangaSlug: manga },
          ],
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
    } else {
      // Partial match on title, or exact match on slug/uid
      subscriptions = await prisma.subscription.findMany({
        where: {
          notifyNewChapter: true,
          OR: [
            { mangaUid: manga },
            { mangaSlug: manga },
            { mangaTitle: { contains: manga } },
          ],
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
    }

    // Filter to only users who have email updates enabled
    const eligibleSubscribers = subscriptions.filter(
      (sub) => sub.user.emailUpdatesOptIn
    );

    // Get manga info from first subscription (if any)
    const firstSub = subscriptions[0];

    if (!firstSub) {
      return NextResponse.json({
        manga,
        mangaUid: null,
        mangaSlug: null,
        mangaTitle: null,
        totalSubscribers: 0,
        subscribers: [],
        message: 'No subscriptions found for this manga',
      });
    }

    return NextResponse.json({
      manga,
      mangaUid: firstSub.mangaUid,
      mangaSlug: firstSub.mangaSlug,
      mangaTitle: firstSub.mangaTitle,
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
 * POST /api/subscribers
 * 
 * Returns list of subscriber emails for a given manga.
 * Accepts manga identifier in request body.
 * 
 * Body:
 * {
 *   manga: string,     // Manga name, slug, or UID (required)
 *   exact?: boolean    // If true, requires exact match (default: false)
 * }
 * 
 * Headers:
 * - x-api-key: API secret for authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key for security
    const apiKey = request.headers.get('x-api-key');
    if (API_SECRET && apiKey !== API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { manga, exact = false } = body;

    if (!manga) {
      return NextResponse.json(
        { error: 'Missing required field: manga' },
        { status: 400 }
      );
    }

    // Build search conditions
    let subscriptions;

    if (exact) {
      subscriptions = await prisma.subscription.findMany({
        where: {
          notifyNewChapter: true,
          OR: [
            { mangaUid: manga },
            { mangaSlug: manga },
          ],
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
    } else {
      subscriptions = await prisma.subscription.findMany({
        where: {
          notifyNewChapter: true,
          OR: [
            { mangaUid: manga },
            { mangaSlug: manga },
            { mangaTitle: { contains: manga } },
          ],
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
    }

    // Filter to only users who have email updates enabled
    const eligibleSubscribers = subscriptions.filter(
      (sub) => sub.user.emailUpdatesOptIn
    );

    const firstSub = subscriptions[0];

    if (!firstSub) {
      return NextResponse.json({
        manga,
        mangaUid: null,
        mangaSlug: null,
        mangaTitle: null,
        totalSubscribers: 0,
        subscribers: [],
        message: 'No subscriptions found for this manga',
      });
    }

    return NextResponse.json({
      manga,
      mangaUid: firstSub.mangaUid,
      mangaSlug: firstSub.mangaSlug,
      mangaTitle: firstSub.mangaTitle,
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

