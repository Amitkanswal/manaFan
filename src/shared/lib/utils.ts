import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert a title to URL-friendly slug
 * "Solo Leveling: Arise" -> "solo-leveling-arise"
 * "One Piece" -> "one-piece"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .trim();
}

/**
 * Convert chapter number/title to URL-friendly slug
 * "Chapter 1" -> "chapter-1"
 * 150 -> "chapter-150"
 */
export function toChapterSlug(chapter: { number: number; title?: string }): string {
  return `chapter-${chapter.number}`;
}

/**
 * Extract chapter number from slug
 * "chapter-1" -> 1
 * "chapter-150" -> 150
 */
export function parseChapterSlug(slug: string): number | null {
  const match = slug.match(/chapter-(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}
