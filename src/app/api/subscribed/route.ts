import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// API Key for authorization (set this in your .env.local)
const API_KEY = process.env.SUBSCRIBED_API_KEY;

/**
 * Validate API key from request headers
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');

  // Check Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === API_KEY;
  }

  // Check X-API-Key header
  if (apiKey) {
    return apiKey === API_KEY;
  }

  return false;
}

/**
 * GET /api/subscribed?mangaName=<manga_name>
 * 
 * Headers required:
 *   - Authorization: Bearer <API_KEY>
 *   - OR X-API-Key: <API_KEY>
 * 
 * Returns list of email IDs subscribed to a manga
 */
export async function GET(request: NextRequest) {
  // Check if API key is configured
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured on server' },
      { status: 500 }
    );
  }

  // Validate authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid API key in Authorization or X-API-Key header' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const mangaName = searchParams.get('mangaName');

    if (!mangaName) {
      return NextResponse.json(
        { error: 'mangaName is required' },
        { status: 400 }
      );
    }

    console.log('[API/subscribed GET] Searching for manga:', mangaName);
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { mangaTitle: { contains: mangaName, mode: 'insensitive' } },
          { mangaSlug: { contains: mangaName, mode: 'insensitive' } },
          { mangaUid: { contains: mangaName, mode: 'insensitive' } },
        ],
      },
      select: {
        mangaUid: true,
        mangaSlug: true,
        mangaTitle: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    
    console.log('[API/subscribed GET] Found subscriptions:', subscriptions.length);

    const emails = subscriptions.map((sub) => sub.user.email);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscribed
 * 
 * Headers required:
 *   - Authorization: Bearer <API_KEY>
 *   - OR X-API-Key: <API_KEY>
 * 
 * Body: { mangaName: string, notifyOnly?: boolean }
 * Returns list of email IDs
 */
export async function POST(request: NextRequest) {
  // Check if API key is configured
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured on server' },
      { status: 500 }
    );
  }

  // Validate authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid API key in Authorization or X-API-Key header' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { mangaName, notifyOnly } = body;

    if (!mangaName) {
      return NextResponse.json(
        { error: 'mangaName is required' },
        { status: 400 }
      );
    }

    console.log('[API/subscribed POST] Searching for manga:', mangaName, '| notifyOnly:', notifyOnly);
    
    const whereClause: any = {
      OR: [
        { mangaTitle: { contains: mangaName, mode: 'insensitive' } },
        { mangaSlug: { contains: mangaName, mode: 'insensitive' } },
        { mangaUid: { contains: mangaName, mode: 'insensitive' } },
      ],
    };

    if (notifyOnly) {
      whereClause.notifyNewChapter = true;
      whereClause.user = { emailUpdatesOptIn: true };
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      select: {
        mangaUid: true,
        mangaSlug: true,
        mangaTitle: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    
    console.log('[API/subscribed POST] Found subscriptions:', subscriptions.length);

    const emails = subscriptions.map((sub) => sub.user.email);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}
