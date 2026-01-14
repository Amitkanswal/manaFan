import { Manga, Chapter, MangaFilters } from '../types';
import { MOCK_MANGA } from './mock-data';
import { toSlug } from '@/shared/lib/utils';

// Simulate network latency
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Add slugs to mock data
const enrichedMockManga: Manga[] = MOCK_MANGA.map(manga => ({
  ...manga,
  slug: toSlug(manga.title),
  chapters: manga.chapters.map(ch => ({
    ...ch,
    slug: `chapter-${ch.number}`,
  })),
}));

export const mangaApi = {
  async getAll(filters?: MangaFilters): Promise<Manga[]> {
    await delay();
    
    let result = [...enrichedMockManga];
    
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.author.toLowerCase().includes(query)
      );
    }
    
    if (filters?.status) {
      result = result.filter(m => m.status === filters.status);
    }
    
    if (filters?.genre) {
      result = result.filter(m => m.genres.includes(filters.genre!));
    }
    
    return result;
  },

  async getById(id: string): Promise<Manga | null> {
    await delay();
    return enrichedMockManga.find(m => m.id === id) ?? null;
  },

  async getBySlug(slug: string): Promise<Manga | null> {
    await delay();
    return enrichedMockManga.find(m => m.slug === slug) ?? null;
  },

  async getChapter(mangaId: string, chapterId: string): Promise<{ manga: Manga; chapter: Chapter; pages: string[] } | null> {
    await delay();
    
    const manga = enrichedMockManga.find(m => m.id === mangaId);
    if (!manga) return null;
    
    const chapter = manga.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;

    // Generate mock pages
    const pages = Array.from({ length: 8 }, (_, i) =>
      `https://placehold.co/800x1200/2a2a2a/FFF?text=${encodeURIComponent(manga.title)}+Page+${i + 1}`
    );

    return { manga, chapter, pages };
  },

  async getChapterBySlug(mangaSlug: string, chapterNumber: number): Promise<{ manga: Manga; chapter: Chapter; pages: string[] } | null> {
    await delay();
    
    const manga = enrichedMockManga.find(m => m.slug === mangaSlug);
    if (!manga) return null;
    
    const chapter = manga.chapters.find(c => c.number === chapterNumber);
    if (!chapter) return null;

    // Generate mock pages
    const pages = Array.from({ length: 8 }, (_, i) =>
      `https://placehold.co/800x1200/2a2a2a/FFF?text=${encodeURIComponent(manga.title)}+Page+${i + 1}`
    );

    return { manga, chapter, pages };
  },

  async getGenres(): Promise<string[]> {
    const allGenres = enrichedMockManga.flatMap(m => m.genres);
    return Array.from(new Set(allGenres)).sort();
  }
};
