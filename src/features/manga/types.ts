export interface Chapter {
  id: string;
  number: number;
  title: string;
  date: string;
  slug: string; // URL-friendly slug like "chapter-1"
}

export interface Manga {
  id: string;
  slug: string; // URL-friendly slug like "one-piece"
  title: string;
  author: string;
  cover: string;
  banner: string;
  synopsis: string;
  rating: number;
  views: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  updatedAt: string;
  genres: string[];
  chapters: Chapter[];
  // Community stats
  readers: number;
  followers: number;
}

export interface MangaFilters {
  searchQuery?: string;
  status?: Manga['status'];
  genre?: string;
  /** Taxonomy term UID for genre filtering (e.g., 'action', 'slice_of_life') */
  genreTermUid?: string;
  /** Taxonomy term UID for status filtering (e.g., 'ongoing', 'completed') */
  statusTermUid?: string;
}

/** Genre taxonomy term */
export interface GenreTerm {
  name: string;
  termUid: string;
}

/** Status taxonomy term */
export interface StatusTerm {
  name: string;
  termUid: string;
}
