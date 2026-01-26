import { NextRequest, NextResponse } from 'next/server';
import { cmaApi } from '@/lib/contentstack/cma';

/**
 * API Route: GET /api/manga/taxonomies
 * Fetches taxonomy terms (genres, statuses) from Contentstack using CMA
 * 
 * Query params:
 * - type: 'genre' | 'status' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    const result: {
      genres?: Array<{ name: string; termUid: string }>;
      statuses?: Array<{ name: string; termUid: string }>;
    } = {};

    if (type === 'genre' || type === 'all') {
      try {
        const genreResponse = await cmaApi.getTaxonomyTerms('genre');
        result.genres = genreResponse.terms.map(term => ({
          name: term.name || formatTermName(term.term_uid),
          termUid: term.term_uid,
        })).sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.warn('[API] Failed to fetch genre taxonomy, using fallback:', error);
        result.genres = getDefaultGenres();
      }
    }

    if (type === 'status' || type === 'all') {
      try {
        const statusResponse = await cmaApi.getTaxonomyTerms('status');
        result.statuses = statusResponse.terms.map(term => ({
          name: term.name || formatTermName(term.term_uid),
          termUid: term.term_uid,
        })).sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.warn('[API] Failed to fetch status taxonomy, using fallback:', error);
        result.statuses = getDefaultStatuses();
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error fetching taxonomies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taxonomies', details: String(error) },
      { status: 500 }
    );
  }
}

function formatTermName(termUid: string): string {
  return termUid
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getDefaultGenres() {
  return [
    { name: 'Action', termUid: 'action' },
    { name: 'Adventure', termUid: 'adventure' },
    { name: 'Comedy', termUid: 'comedy' },
    { name: 'Drama', termUid: 'drama' },
    { name: 'Fantasy', termUid: 'fantasy' },
    { name: 'Horror', termUid: 'horror' },
    { name: 'Mystery', termUid: 'mystery' },
    { name: 'Romance', termUid: 'romance' },
    { name: 'Sci-Fi', termUid: 'sci_fi' },
    { name: 'Slice of Life', termUid: 'slice_of_life' },
  ];
}

function getDefaultStatuses() {
  return [
    { name: 'Ongoing', termUid: 'ongoing' },
    { name: 'Completed', termUid: 'completed' },
    { name: 'Hiatus', termUid: 'hiatus' },
  ];
}
