import { NextRequest, NextResponse } from 'next/server';
import { cmaApi, CMAEntry } from '@/lib/contentstack/cma';
import { toSlug } from '@/shared/lib/utils';

/**
 * API Route: GET /api/manga/filter
 * Fetches manga entries filtered by taxonomy using CMA
 * 
 * Query params:
 * - genre: Genre taxonomy term UID (e.g., 'action', 'romance')
 * - status: Status taxonomy term UID (e.g., 'ongoing', 'completed')
 * - search: Optional search query for additional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    // If no taxonomy filters, redirect to entries endpoint
    if (!genre && !status) {
      // Fetch all entries without taxonomy filter
      const response = await cmaApi.getEntries('manga', {
        locale: 'en-us',
        include_reference: ['author'],
      });

      const chaptersResponse = await cmaApi.getEntries('manga_list', {
        locale: 'en-us',
        include_reference: ['managa'],
      });

      let mangaList = response.entries.map(entry => 
        transformCMAMangaEntry(entry, chaptersResponse.entries)
      );

      if (search) {
        mangaList = mangaList.filter(manga => 
          manga.title.toLowerCase().includes(search) ||
          manga.author.toLowerCase().includes(search)
        );
      }

      return NextResponse.json({
        entries: mangaList,
        count: mangaList.length,
        filter: { genre: null, status: null },
      });
    }

    // Fetch chapters first (needed for transformation)
    const chaptersResponse = await cmaApi.getEntries('manga_list', {
      locale: 'en-us',
      include_reference: ['managa'],
    });

    let mangaEntries: CMAEntry[] = [];

    // Apply taxonomy filters using CMA
    if (genre && status) {
      // Both filters - need to fetch by one and filter by other
      // Fetch by genre first (usually more restrictive)
      const genreResponse = await cmaApi.getEntriesByTaxonomy('manga', {
        taxonomyUid: 'genre',
        termUid: genre,
      }, {
        locale: 'en-us',
        include_reference: ['author'],
      });

      // Filter results by status taxonomy client-side
      mangaEntries = genreResponse.entries.filter(entry => {
        const taxonomies = (entry.taxonomies || []) as Array<{
          taxonomy_uid: string;
          term_uid: string;
        }>;
        return taxonomies.some(t => 
          t.taxonomy_uid === 'status' && t.term_uid.toLowerCase() === status.toLowerCase()
        );
      });
    } else if (genre) {
      // Filter by genre taxonomy only
      const response = await cmaApi.getEntriesByTaxonomy('manga', {
        taxonomyUid: 'genre',
        termUid: genre,
      }, {
        locale: 'en-us',
        include_reference: ['author'],
      });
      mangaEntries = response.entries;
    } else if (status) {
      // Filter by status taxonomy only
      const response = await cmaApi.getEntriesByTaxonomy('manga', {
        taxonomyUid: 'status',
        termUid: status.toLowerCase(),
      }, {
        locale: 'en-us',
        include_reference: ['author'],
      });
      mangaEntries = response.entries;
    }

    // Transform entries to app format
    let mangaList = mangaEntries.map(entry => 
      transformCMAMangaEntry(entry, chaptersResponse.entries)
    );

    // Apply search filter if provided
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
      filter: { genre, status },
    });
  } catch (error) {
    console.error('[API] Error filtering manga by taxonomy:', error);
    return NextResponse.json(
      { error: 'Failed to filter manga', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Transform CMA entry to app Manga format
 */
function transformCMAMangaEntry(entry: CMAEntry, chapters: CMAEntry[]) {
  const taxonomies = (entry.taxonomies || []) as Array<{
    taxonomy_uid: string;
    term_uid: string;
    name?: string;
  }>;

  const genres = taxonomies
    .filter(t => t.taxonomy_uid === 'genre')
    .map(t => t.name || formatTermName(t.term_uid));

  const statusTax = taxonomies.find(t => t.taxonomy_uid === 'status');
  const rawStatus = statusTax?.name || statusTax?.term_uid || 'Ongoing';
  const status = normalizeStatus(rawStatus);

  const authorRef = entry.author as Array<{ uid: string; title: string }> | undefined;
  const authorName = authorRef?.[0]?.title || 'Unknown Author';

  const url = entry.url as string | undefined;
  const mangaSlug = url ? url.replace(/^\//, '') : toSlug(entry.title);

  const mangaImage = entry.manga_image as { url?: string } | undefined;
  const bannerImage = entry.banner_image as { url?: string } | undefined;

  const ratingData = (entry.rating || {}) as {
    rating?: number;
    total_readers?: number;
    total_followers?: number;
  };

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
