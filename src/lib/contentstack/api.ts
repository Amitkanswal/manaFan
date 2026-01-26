import { stack, CONTENT_TYPES, TAXONOMIES } from './client';
import { CSManga, CSMangaList, CSTaxonomyTerm } from './types';
import { Manga, Chapter, MangaFilters } from '@/features/manga/types';
import { toSlug } from '@/shared/lib/utils';

// Genre taxonomy term interface
interface GenreTerm {
  uid: string;
  name: string;
  term_uid: string;
}

/**
 * Convert title to URL-friendly slug
 */
function createSlug(title: string): string {
  return toSlug(title);
}

/**
 * Transform Contentstack Manga to App Manga type
 */
function transformManga(csManga: CSManga, chapters: CSMangaList[] = []): Manga {
  // Extract genres from taxonomies
  const genres = csManga.taxonomies
    ?.filter(t => t.taxonomy_uid === 'genre')
    .map(t => t.name || t.term_uid) || [];

  // Extract status from taxonomies
  const statusTax = csManga.taxonomies?.find(t => t.taxonomy_uid === 'status');
  const status = (statusTax?.name || statusTax?.term_uid || 'Ongoing') as Manga['status'];

  // Get author name
  const authorName = csManga.author?.[0]?.title || 'Unknown Author';

  // Create slug from title
  const mangaSlug = csManga.url ? csManga.url.replace(/^\//, '') : createSlug(csManga.title);

  // Transform chapters
  const transformedChapters: Chapter[] = chapters
    .filter(ch => ch.managa?.[0]?.uid === csManga.uid)
    .map((ch, index) => {
      const chapterNum = extractChapterNumber(ch.title) || (chapters.length - index);
      return {
        id: ch.uid,
        number: chapterNum,
        title: ch.title,
        date: ch.updated_at ? new Date(ch.updated_at).toISOString().split('T')[0] : 'N/A',
        slug: `chapter-${chapterNum}`,
      };
    })
    .sort((a, b) => b.number - a.number);

  // Rating data
  const ratingData = csManga.rating || {};

  return {
    id: csManga.uid,
    slug: mangaSlug,
    title: csManga.title,
    author: authorName,
    cover: csManga.manga_image?.url || 'https://placehold.co/300x450/1a1a1a/FFF?text=No+Cover',
    banner: csManga.banner_image?.url || 'https://placehold.co/1200x400/2a2a2a/FFF?text=No+Banner',
    synopsis: csManga.description || 'No description available.',
    rating: ratingData.rating || 4.5,
    views: formatViews(ratingData.total_readers || 0),
    status: normalizeStatus(status),
    updatedAt: csManga.updated_at ? new Date(csManga.updated_at).toISOString().split('T')[0] : 'N/A',
    genres,
    chapters: transformedChapters.length > 0 ? transformedChapters : generateMockChapters(10),
    readers: ratingData.total_readers || 0,
    followers: ratingData.total_followers || 0,
  };
}

/**
 * Extract chapter number from title like "Chapter 1" or "Ch. 10"
 */
function extractChapterNumber(title: string): number | null {
  const match = title.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format view count
 */
function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Normalize status to expected values
 */
function normalizeStatus(status: string): Manga['status'] {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete')) return 'Completed';
  if (normalized.includes('hiatus')) return 'Hiatus';
  return 'Ongoing';
}

/**
 * Generate mock chapters if none exist
 */
function generateMockChapters(count: number): Chapter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ch-${count - i}`,
    number: count - i,
    title: `Chapter ${count - i}`,
    date: new Date().toISOString().split('T')[0],
    slug: `chapter-${count - i}`,
  }));
}

/**
 * Contentstack API Service
 */
export const contentstackApi = {
  /**
   * Get all manga entries with optional filtering
   * Note: Filters are applied client-side after fetching from CMS
   */
  async getMangaList(filters?: MangaFilters): Promise<Manga[]> {
    try {
      // Fetch all manga entries with references
      const mangaQuery = stack
        .contentType(CONTENT_TYPES.MANGA)
        .entry()
        .includeReference(['author'])
        .includeFallback()
        .locale('en-us');

      const mangaResponse = await mangaQuery.find<CSManga>();
      const mangaEntries = mangaResponse.entries || [];

      // Fetch all chapters
      const chaptersQuery = stack
        .contentType(CONTENT_TYPES.MANGA_LIST)
        .entry()
        .includeReference(['managa'])
        .includeFallback()
        .locale('en-us');

      const chaptersResponse = await chaptersQuery.find<CSMangaList>();
      const chapters = chaptersResponse.entries || [];

      // Transform to app format
      let mangaList = mangaEntries.map(m => transformManga(m, chapters));

      // Apply filters client-side
      // Genre filter (using taxonomy term UID)
      const genreTermUid = filters?.genreTermUid || 
        (filters?.genre ? filters.genre.toLowerCase().replace(/\s+/g, '_') : null);
      
      if (genreTermUid) {
        mangaList = mangaList.filter(m => 
          m.genres.some(g => g.toLowerCase().replace(/\s+/g, '_') === genreTermUid)
        );
      }

      // Status filter
      if (filters?.status) {
        mangaList = mangaList.filter(m => m.status === filters.status);
      }

      // Search filter
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        mangaList = mangaList.filter(m =>
          m.title.toLowerCase().includes(query) ||
          m.author.toLowerCase().includes(query) ||
          m.genres.some(g => g.toLowerCase().includes(query))
        );
      }

      return mangaList;
    } catch (error) {
      console.error('Error fetching manga list from Contentstack:', error);
      throw error;
    }
  },

  /**
   * Get manga by genre using taxonomy (client-side filter)
   */
  async getMangaByGenre(genreTermUid: string): Promise<Manga[]> {
    try {
      // Fetch all manga with genre filter applied via getMangaList
      return await this.getMangaList({ genre: genreTermUid });
    } catch (error) {
      console.error('Error fetching manga by genre:', error);
      throw error;
    }
  },

  /**
   * Get manga by status using taxonomy (client-side filter)
   */
  async getMangaByStatus(statusTermUid: string): Promise<Manga[]> {
    try {
      const statusMap: Record<string, Manga['status']> = {
        ongoing: 'Ongoing',
        completed: 'Completed',
        hiatus: 'Hiatus',
      };
      const status = statusMap[statusTermUid.toLowerCase()] || 'Ongoing';
      return await this.getMangaList({ status });
    } catch (error) {
      console.error('Error fetching manga by status:', error);
      throw error;
    }
  },

  /**
   * Get single manga by slug
   */
  async getMangaBySlug(slug: string): Promise<Manga | null> {
    try {
      // Get all manga and find by slug
      const mangaList = await this.getMangaList();
      return mangaList.find(m => m.slug === slug) || null;
    } catch (error) {
      console.error('Error fetching manga by slug from Contentstack:', error);
      throw error;
    }
  },

  /**
   * Get single manga by UID (kept for backwards compatibility)
   */
  async getMangaById(uid: string): Promise<Manga | null> {
    try {
      const mangaQuery = stack
        .contentType(CONTENT_TYPES.MANGA)
        .entry(uid)
        .includeReference(['author'])
        .includeFallback()
        .locale('en-us');

      const mangaResponse = await mangaQuery.fetch() as unknown as CSManga;
      
      if (!mangaResponse || !mangaResponse.uid) {
        return null;
      }

      const chaptersQuery = stack
        .contentType(CONTENT_TYPES.MANGA_LIST)
        .entry()
        .includeReference(['managa'])
        .includeFallback()
        .locale('en-us');

      const chaptersResponse = await chaptersQuery.find<CSMangaList>();
      const chapters = (chaptersResponse.entries || []).filter(
        ch => ch.managa?.[0]?.uid === uid
      );

      return transformManga(mangaResponse, chapters);
    } catch (error) {
      console.error('Error fetching manga by ID from Contentstack:', error);
      throw error;
    }
  },

  /**
   * Get chapter by manga slug and chapter number
   */
  async getChapterBySlug(mangaSlug: string, chapterNumber: number): Promise<{
    manga: Manga;
    chapter: Chapter;
    pages: string[];
  } | null> {
    try {
      // Get manga by slug
      const manga = await this.getMangaBySlug(mangaSlug);
      if (!manga) {
        return null;
      }

      // Find the chapter by number
      const chapter = manga.chapters.find(ch => ch.number === chapterNumber);
      if (!chapter) {
        return null;
      }

      // Fetch chapter data for pages
      const chapterQuery = stack
        .contentType(CONTENT_TYPES.MANGA_LIST)
        .entry(chapter.id)
        .includeReference(['managa'])
        .includeFallback()
        .locale('en-us');

      const chapterResponse = await chapterQuery.fetch() as unknown as CSMangaList;

      // Extract pages from panels
      const pages: string[] = [];
      if (chapterResponse?.panel && chapterResponse.panel.length > 0) {
        chapterResponse.panel.forEach(panel => {
          if (panel.image && panel.image.length > 0) {
            panel.image.forEach(img => {
              if (img.url) {
                pages.push(img.url);
              }
            });
          }
        });
      }

      // If no pages, generate placeholders
      if (pages.length === 0) {
        for (let i = 1; i <= 8; i++) {
          pages.push(`https://placehold.co/800x1200/2a2a2a/FFF?text=${encodeURIComponent(manga.title)}+Page+${i}`);
        }
      }

      return { manga, chapter, pages };
    } catch (error) {
      console.error('Error fetching chapter from Contentstack:', error);
      throw error;
    }
  },

  /**
   * Get all available genres from taxonomy
   * Fetches unique genres from all manga entries' taxonomy data
   */
  async getGenres(): Promise<{ name: string; termUid: string }[]> {
    try {
      // Fetch all manga to extract unique genre taxonomy terms
      const mangaQuery = stack
        .contentType(CONTENT_TYPES.MANGA)
        .entry()
        .only(['taxonomies'])
        .includeFallback()
        .locale('en-us');

      const mangaResponse = await mangaQuery.find<CSManga>();
      const mangaEntries = mangaResponse.entries || [];

      // Extract unique genre terms from taxonomies
      const genreMap = new Map<string, { name: string; termUid: string }>();
      
      mangaEntries.forEach(manga => {
        manga.taxonomies
          ?.filter(t => t.taxonomy_uid === TAXONOMIES.GENRE)
          .forEach(t => {
            if (!genreMap.has(t.term_uid)) {
              genreMap.set(t.term_uid, {
                name: t.name || formatTermName(t.term_uid),
                termUid: t.term_uid
              });
            }
          });
      });

      // Sort by name and return
      return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching genres from taxonomy:', error);
      return [];
    }
  },

  /**
   * Get all available statuses from taxonomy
   */
  async getStatuses(): Promise<{ name: string; termUid: string }[]> {
    try {
      const mangaQuery = stack
        .contentType(CONTENT_TYPES.MANGA)
        .entry()
        .only(['taxonomies'])
        .includeFallback()
        .locale('en-us');

      const mangaResponse = await mangaQuery.find<CSManga>();
      const mangaEntries = mangaResponse.entries || [];

      const statusMap = new Map<string, { name: string; termUid: string }>();
      
      mangaEntries.forEach(manga => {
        manga.taxonomies
          ?.filter(t => t.taxonomy_uid === TAXONOMIES.STATUS)
          .forEach(t => {
            if (!statusMap.has(t.term_uid)) {
              statusMap.set(t.term_uid, {
                name: t.name || formatTermName(t.term_uid),
                termUid: t.term_uid
              });
            }
          });
      });

      return Array.from(statusMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching statuses from taxonomy:', error);
      return [];
    }
  },

  // ============================================
  // SIMILAR MANGA / RECOMMENDATIONS
  // ============================================

  /**
   * Get similar manga based on genre overlap using taxonomy
   * Scores results by number of matching genres
   * @param genres - Array of genre names or term UIDs from current manga
   * @param excludeUid - UID of current manga to exclude from results
   * @param limit - Maximum number of results to return (default: 6)
   */
  async getSimilarManga(genres: string[], excludeUid: string, limit = 6): Promise<Manga[]> {
    try {
      if (!genres || genres.length === 0) {
        return [];
      }

      // Normalize genres to term UIDs for comparison
      const normalizedGenres = genres.map(g => 
        g.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
      );

      // Fetch all manga entries with references
      const mangaQuery = stack
        .contentType(CONTENT_TYPES.MANGA)
        .entry()
        .includeReference(['author'])
        .includeFallback()
        .locale('en-us');

      const mangaResponse = await mangaQuery.find<CSManga>();
      const mangaEntries = mangaResponse.entries || [];

      // Fetch all chapters for transformation
      const chaptersQuery = stack
        .contentType(CONTENT_TYPES.MANGA_LIST)
        .entry()
        .includeReference(['managa'])
        .includeFallback()
        .locale('en-us');

      const chaptersResponse = await chaptersQuery.find<CSMangaList>();
      const chapters = chaptersResponse.entries || [];

      // Score and filter manga by genre overlap
      const scoredManga: Array<{ manga: Manga; score: number }> = [];

      for (const entry of mangaEntries) {
        // Skip the current manga
        if (entry.uid === excludeUid) {
          continue;
        }

        // Extract genre term UIDs from this manga
        const entryGenres = entry.taxonomies
          ?.filter(t => t.taxonomy_uid === 'genre')
          .map(t => t.term_uid.toLowerCase()) || [];

        // Calculate overlap score (number of matching genres)
        const overlapScore = normalizedGenres.filter(g => 
          entryGenres.includes(g)
        ).length;

        // Only include if there's at least one matching genre
        if (overlapScore > 0) {
          const transformedManga = transformManga(entry, chapters);
          scoredManga.push({
            manga: transformedManga,
            score: overlapScore,
          });
        }
      }

      // Sort by score (highest first), then by rating as secondary
      scoredManga.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary sort by rating
        return b.manga.rating - a.manga.rating;
      });

      // Return top results
      return scoredManga.slice(0, limit).map(item => item.manga);
    } catch (error) {
      console.error('Error fetching similar manga:', error);
      return [];
    }
  },

  /**
   * Get manga recommendations based on user's genre preferences
   * Uses weighted scoring based on user's reading history
   * @param genrePreferences - Map of genre -> read count (weighted preferences)
   * @param excludeUids - UIDs of manga to exclude (already read/viewed)
   * @param limit - Maximum number of results
   */
  async getRecommendedManga(
    genrePreferences: Map<string, number>,
    excludeUids: string[] = [],
    limit = 8
  ): Promise<Manga[]> {
    try {
      if (genrePreferences.size === 0) {
        // Return popular manga for new users
        const allManga = await this.getMangaList();
        return allManga
          .filter(m => !excludeUids.includes(m.id))
          .sort((a, b) => b.readers - a.readers)
          .slice(0, limit);
      }

      // Fetch all manga
      const mangaQuery = stack
        .contentType(CONTENT_TYPES.MANGA)
        .entry()
        .includeReference(['author'])
        .includeFallback()
        .locale('en-us');

      const mangaResponse = await mangaQuery.find<CSManga>();
      const mangaEntries = mangaResponse.entries || [];

      // Fetch chapters
      const chaptersQuery = stack
        .contentType(CONTENT_TYPES.MANGA_LIST)
        .entry()
        .includeReference(['managa'])
        .includeFallback()
        .locale('en-us');

      const chaptersResponse = await chaptersQuery.find<CSMangaList>();
      const chapters = chaptersResponse.entries || [];

      // Score manga based on user preferences
      const scoredManga: Array<{ manga: Manga; score: number }> = [];

      for (const entry of mangaEntries) {
        // Skip excluded manga
        if (excludeUids.includes(entry.uid)) {
          continue;
        }

        // Extract genre term UIDs
        const entryGenres = entry.taxonomies
          ?.filter(t => t.taxonomy_uid === 'genre')
          .map(t => t.term_uid.toLowerCase().replace(/-/g, '_')) || [];

        // Calculate weighted score based on user's genre preferences
        let weightedScore = 0;
        for (const genre of entryGenres) {
          const preference = genrePreferences.get(genre) || 0;
          weightedScore += preference;
        }

        if (weightedScore > 0) {
          const transformedManga = transformManga(entry, chapters);
          scoredManga.push({
            manga: transformedManga,
            score: weightedScore,
          });
        }
      }

      // Sort by weighted score, then by rating
      scoredManga.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.manga.rating - a.manga.rating;
      });

      return scoredManga.slice(0, limit).map(item => item.manga);
    } catch (error) {
      console.error('Error fetching recommended manga:', error);
      return [];
    }
  },

  // ============================================
  // PERSONALIZED CONTENT METHODS
  // ============================================

  /**
   * Get personalized banner by experience and variant ID
   */
  async getPersonalizedBanner(experienceId: string, variantId: string): Promise<PersonalizedBanner | null> {
    try {
      // Fetch all banners and filter client-side (simpler approach)
      const entriesQuery = stack
        .contentType('personalized_banner')
        .entry()
        .includeFallback()
        .locale('en-us');

      const response = await entriesQuery.find<PersonalizedBannerEntry>();
      const entries = response.entries || [];
      
      // Find matching entry
      const entry = entries.find(
        (e: PersonalizedBannerEntry) => e.experience_id === experienceId && e.variant_id === variantId
      );
      
      if (!entry) {
        return null;
      }

      return {
        title: entry.title,
        experience_id: entry.experience_id,
        variant_id: entry.variant_id,
        headline: entry.headline,
        headline_jp: entry.headline_jp,
        subtext: entry.subtext,
        cta_text: entry.cta_text,
        cta_link: entry.cta_link,
        icon: entry.icon,
        gradient: entry.gradient,
        priority: entry.priority,
      };
    } catch (error) {
      console.error('Error fetching personalized banner:', error);
      return null;
    }
  },

  /**
   * Get personalized hero content by experience and variant ID
   */
  async getPersonalizedHero(experienceId: string, variantId: string): Promise<PersonalizedHero | null> {
    try {
      const entriesQuery = stack
        .contentType('personalized_hero')
        .entry()
        .includeReference(['featured_manga'])
        .includeFallback()
        .locale('en-us');

      const response = await entriesQuery.find<PersonalizedHeroEntry>();
      const entries = response.entries || [];
      
      const entry = entries.find(
        (e: PersonalizedHeroEntry) => e.experience_id === experienceId && e.variant_id === variantId
      );
      
      if (!entry) {
        return null;
      }

      const featuredManga = entry.featured_manga?.[0];

      return {
        title: entry.title,
        experience_id: entry.experience_id,
        variant_id: entry.variant_id,
        featured_manga: featuredManga ? {
          uid: featuredManga.uid,
          title: featuredManga.title,
          cover: featuredManga.manga_image?.url,
          banner: featuredManga.banner_image?.url,
          description: featuredManga.description,
        } : undefined,
        badge_text: entry.badge_text,
        badge_text_jp: entry.badge_text_jp,
        override_synopsis: entry.override_synopsis,
      };
    } catch (error) {
      console.error('Error fetching personalized hero:', error);
      return null;
    }
  },

  /**
   * Get personalized manga list by experience and variant ID
   */
  async getPersonalizedMangaList(experienceId: string, variantId: string): Promise<PersonalizedMangaList | null> {
    try {
      const entriesQuery = stack
        .contentType('personalized_manga_list')
        .entry()
        .includeReference(['manga_list'])
        .includeFallback()
        .locale('en-us');

      const response = await entriesQuery.find<PersonalizedMangaListEntry>();
      const entries = response.entries || [];
      
      const entry = entries.find(
        (e: PersonalizedMangaListEntry) => e.experience_id === experienceId && e.variant_id === variantId
      );
      
      if (!entry) {
        return null;
      }

      // Transform manga list references to full manga objects
      const mangaList = await Promise.all(
        (entry.manga_list || []).map(async (ref: { uid: string }) => {
          if (ref.uid) {
            const manga = await contentstackApi.getMangaById(ref.uid);
            return manga;
          }
          return null;
        })
      );

      return {
        title: entry.title,
        experience_id: entry.experience_id,
        variant_id: entry.variant_id,
        section_title: entry.section_title,
        section_title_jp: entry.section_title_jp,
        manga_list: mangaList.filter((m): m is Manga => m !== null),
        display_order: entry.display_order,
        target_audience: entry.target_audience,
      };
    } catch (error) {
      console.error('Error fetching personalized manga list:', error);
      return null;
    }
  },

  /**
   * Get all personalized manga lists for recommendations
   */
  async getAllPersonalizedMangaLists(): Promise<PersonalizedMangaList[]> {
    try {
      const entriesQuery = stack
        .contentType('personalized_manga_list')
        .entry()
        .includeReference(['manga_list'])
        .includeFallback()
        .locale('en-us');

      const response = await entriesQuery.find<PersonalizedMangaListEntry>();
      const entries = response.entries || [];

      const lists = await Promise.all(
        entries.map(async (entry: PersonalizedMangaListEntry) => {
          const mangaList = await Promise.all(
            (entry.manga_list || []).map(async (ref: { uid: string }) => {
              if (ref.uid) {
                const manga = await contentstackApi.getMangaById(ref.uid);
                return manga;
              }
              return null;
            })
          );

          return {
            title: entry.title,
            experience_id: entry.experience_id,
            variant_id: entry.variant_id,
            section_title: entry.section_title,
            section_title_jp: entry.section_title_jp,
            manga_list: mangaList.filter((m): m is Manga => m !== null),
            display_order: entry.display_order,
            target_audience: entry.target_audience,
          };
        })
      );

      return lists.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    } catch (error) {
      console.error('Error fetching all personalized manga lists:', error);
      return [];
    }
  },
};

/**
 * Format term_uid to readable name
 * e.g., "slice_of_life" -> "Slice of Life"
 */
function formatTermName(termUid: string): string {
  return termUid
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// PERSONALIZED CONTENT TYPES
// ============================================

export interface PersonalizedBanner {
  title: string;
  experience_id: string;
  variant_id: string;
  headline: string;
  headline_jp?: string;
  subtext?: string;
  cta_text?: string;
  cta_link?: string;
  icon?: string;
  gradient?: string;
  priority?: number;
}

interface PersonalizedBannerEntry {
  uid: string;
  title: string;
  experience_id: string;
  variant_id: string;
  headline: string;
  headline_jp?: string;
  subtext?: string;
  cta_text?: string;
  cta_link?: string;
  icon?: string;
  gradient?: string;
  priority?: number;
}

export interface PersonalizedHero {
  title: string;
  experience_id: string;
  variant_id: string;
  featured_manga?: {
    uid: string;
    title: string;
    cover?: string;
    banner?: string;
    description?: string;
  };
  badge_text?: string;
  badge_text_jp?: string;
  override_synopsis?: string;
}

interface PersonalizedHeroEntry {
  uid: string;
  title: string;
  experience_id: string;
  variant_id: string;
  featured_manga?: CSManga[];
  badge_text?: string;
  badge_text_jp?: string;
  override_synopsis?: string;
}

export interface PersonalizedMangaList {
  title: string;
  experience_id: string;
  variant_id: string;
  section_title: string;
  section_title_jp?: string;
  manga_list: Manga[];
  display_order?: number;
  target_audience?: string;
}

interface PersonalizedMangaListEntry {
  uid: string;
  title: string;
  experience_id: string;
  variant_id: string;
  section_title: string;
  section_title_jp?: string;
  manga_list?: { uid: string; _content_type_uid: string }[];
  display_order?: number;
  target_audience?: string;
}
