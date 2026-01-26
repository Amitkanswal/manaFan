import { NextRequest, NextResponse } from 'next/server';
import { cmaApi, CMAEntry } from '@/lib/contentstack/cma';
import { toSlug } from '@/shared/lib/utils';

/**
 * API Route: GET /api/manga/entries
 * Fetches all manga entries from Contentstack using CMA
 * 
 * Query params:
 * - search: Search query for title/author filtering (client-side)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase();

    // Fetch all manga entries using CMA
    const response = await cmaApi.getEntries('manga', {
      locale: 'en-us',
      include_reference: ['author'],
    });

    // Fetch all chapters for manga
    const chaptersResponse = await cmaApi.getEntries('manga_list', {
      locale: 'en-us',
      include_reference: ['managa'],
    });

    // Transform entries to app format
    let mangaList = response.entries.map(entry => 
      transformCMAMangaEntry(entry, chaptersResponse.entries)
    );

    // Apply search filter (client-side since CMA doesn't support full-text search easily)
    if (search) {
      mangaList = mangaList.filter(manga => 
        manga.title.toLowerCase().includes(search) ||
        manga.author.toLowerCase().includes(search) ||
        manga.genres.some(g => g.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      entries: mangaList,
      count: mangaList.length,
    });
  } catch (error) {
    console.error('[API] Error fetching manga entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manga entries', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Transform CMA entry to app Manga format
 */
function transformCMAMangaEntry(entry: CMAEntry, chapters: CMAEntry[]) {
  // Extract taxonomies from entry
  const taxonomies = (entry.taxonomies || []) as Array<{
    taxonomy_uid: string;
    term_uid: string;
    name?: string;
  }>;

  // Extract genres from taxonomies
  const genres = taxonomies
    .filter(t => t.taxonomy_uid === 'genre')
    .map(t => t.name || formatTermName(t.term_uid));

  // Extract status from taxonomies
  const statusTax = taxonomies.find(t => t.taxonomy_uid === 'status');
  const rawStatus = statusTax?.name || statusTax?.term_uid || 'Ongoing';
  const status = normalizeStatus(rawStatus);

  // Get author name
  const authorRef = entry.author as Array<{ uid: string; title: string }> | undefined;
  const authorName = authorRef?.[0]?.title || 'Unknown Author';

  // Create slug from title or url
  const url = entry.url as string | undefined;
  const mangaSlug = url ? url.replace(/^\//, '') : toSlug(entry.title);

  // Get cover and banner images
  const mangaImage = entry.manga_image as { url?: string } | undefined;
  const bannerImage = entry.banner_image as { url?: string } | undefined;

  // Get rating data
  const ratingData = (entry.rating || {}) as {
    rating?: number;
    total_readers?: number;
    total_followers?: number;
  };

  // Transform chapters for this manga
  const mangaChapters = chapters
    .filter(ch => {
      const mangaRef = ch.managa as Array<{ uid: string }> | undefined;
      return mangaRef?.[0]?.uid === entry.uid;
    })
    .map((ch, index, arr) => {
      const chapterNum = extractChapterNumber(ch.title) || (arr.length - index);
      return {
        id: ch.uid,
        number: chapterNum,
        title: ch.title,
        date: ch.updated_at ? new Date(ch.updated_at).toISOString().split('T')[0] : 'N/A',
        slug: `chapter-${chapterNum}`,
      };
    })
    .sort((a, b) => b.number - a.number);

  return {
    id: entry.uid,
    slug: mangaSlug,
    title: entry.title,
    author: authorName,
    cover: mangaImage?.url || 'https://placehold.co/300x450/1a1a1a/FFF?text=No+Cover',
    banner: bannerImage?.url || 'https://placehold.co/1200x400/2a2a2a/FFF?text=No+Banner',
    synopsis: (entry.description as string) || 'No description available.',
    rating: ratingData.rating || 4.5,
    views: formatViews(ratingData.total_readers || 0),
    status,
    updatedAt: entry.updated_at ? new Date(entry.updated_at).toISOString().split('T')[0] : 'N/A',
    genres,
    chapters: mangaChapters.length > 0 ? mangaChapters : generateMockChapters(10),
    readers: ratingData.total_readers || 0,
    followers: ratingData.total_followers || 0,
  };
}

function extractChapterNumber(title: string): number | null {
  const match = title.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function normalizeStatus(status: string): 'Ongoing' | 'Completed' | 'Hiatus' {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete')) return 'Completed';
  if (normalized.includes('hiatus')) return 'Hiatus';
  return 'Ongoing';
}

function formatTermName(termUid: string): string {
  return termUid
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateMockChapters(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ch-${count - i}`,
    number: count - i,
    title: `Chapter ${count - i}`,
    date: new Date().toISOString().split('T')[0],
    slug: `chapter-${count - i}`,
  }));
}
