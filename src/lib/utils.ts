import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for conditionally joining and merging Tailwind CSS classes.
 * Uses clsx for conditional class joining and tailwind-merge for deduplication.
 * 
 * @example
 * cn('px-2 py-1', condition && 'bg-red-500', 'px-4') 
 * // Returns 'py-1 bg-red-500 px-4' (px-4 overrides px-2)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

