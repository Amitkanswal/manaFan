/**
 * Manga Feature - Public API
 */

// Types
export type { Manga, Chapter, MangaFilters, GenreTerm, StatusTerm } from './types';

// Hooks
export { 
  useMangaList, 
  useManga, 
  useMangaBySlug,
  useGenres,
  useStatuses,
  useChapter,
  useChapterBySlug 
} from './hooks/use-manga';

// Components
export { MangaCard } from './components/manga-card';
export { MangaGrid } from './components/manga-grid';
export { MangaHero } from './components/manga-hero';
export { SectionRow } from './components/section-row';

// Services
export { mangaApi } from './services/api';
