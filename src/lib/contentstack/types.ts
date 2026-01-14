/**
 * Contentstack Response Types
 * Based on the schema files in src/schema/
 */

// Author content type
export interface CSAuthor {
  uid: string;
  title: string; // Name
  about_author?: string;
  profile_icon?: CSFile;
}

// File/Asset type
export interface CSFile {
  uid: string;
  url: string;
  filename: string;
  content_type: string;
  file_size: string;
  title?: string;
}

// Rating custom field (JSON extension)
export interface CSRating {
  rating?: number;
  total_ratings?: number;
  total_readers?: number;
  total_followers?: number;
}

// Taxonomy term
export interface CSTaxonomyTerm {
  taxonomy_uid: string;
  term_uid: string;
  name?: string;
}

// Manga content type
export interface CSManga {
  uid: string;
  title: string;
  url?: string;
  author?: CSAuthor[];
  taxonomies?: CSTaxonomyTerm[];
  banner_image?: CSFile;
  manga_image?: CSFile;
  rating?: CSRating;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Panel group in Manga List
export interface CSPanel {
  image?: CSFile[];
}

// Manga List (Chapter) content type
export interface CSMangaList {
  uid: string;
  title: string; // Chapter title like "Chapter 1"
  url?: string; // manga-name/chapter-number
  managa?: CSManga[]; // Reference to manga (note: typo in schema "managa")
  panel?: CSPanel[];
  taxonomies?: CSTaxonomyTerm[];
  created_at?: string;
  updated_at?: string;
}

// Contentstack query response
export interface CSResponse<T> {
  entries: T[];
  count?: number;
}

// Contentstack single entry response
export interface CSSingleResponse<T> {
  entry: T;
}

