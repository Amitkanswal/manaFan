"use client";

import { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { contentstackApi } from '@/lib/contentstack';
import { MangaCard } from '@/features/manga';
import { Skeleton } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { Manga } from '@/features/manga/types';

interface SimilarMangaSectionProps {
  /** UID of the current manga to exclude from similar results */
  currentMangaId: string;
  /** Genres of the current manga to find similar titles */
  genres: string[];
  /** Maximum number of similar manga to display */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SimilarMangaSection - "You Would Also Like" recommendations
 * 
 * Fetches and displays manga with similar genres using Contentstack's
 * taxonomy feature. Results are scored by genre overlap.
 */
export function SimilarMangaSection({ 
  currentMangaId,
  genres,
  maxItems = 6,
  className 
}: SimilarMangaSectionProps) {
  const [similarManga, setSimilarManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarManga = async () => {
      // Don't fetch if no genres provided
      if (!genres || genres.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await contentstackApi.getSimilarManga(
          genres,
          currentMangaId,
          maxItems
        );
        setSimilarManga(results);
      } catch (err) {
        console.error('[SimilarManga] Error fetching similar manga:', err);
        setError('Could not load similar manga');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarManga();
  }, [currentMangaId, genres, maxItems]);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={cn("mt-12", className)}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: maxItems }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="aspect-[2/3] rounded-xl mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Don't render if no similar manga found or error
  if (error || similarManga.length === 0) {
    return null;
  }

  // Extract the most common matching genres for display
  const matchingGenres = genres.slice(0, 3).join(', ');

  return (
    <section className={cn("mt-12", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sakura-500/20 to-vermillion-500/20 border border-sakura-500/30 flex items-center justify-center">
          <Heart className="w-6 h-6 text-sakura-400" />
        </div>
        <div>
          <p className="text-sm text-kiniro-400/70 font-medium">
            あなたにおすすめ
          </p>
          <h3 className="text-xl font-bold text-sumi-50">
            You Would Also Like
          </h3>
        </div>
        
        {/* Genre match indicator */}
        <div className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 bg-sumi-800/50 border border-sumi-700/50 rounded-full">
          <Sparkles size={14} className="text-kiniro-400" />
          <span className="text-xs text-sumi-400">
            Based on <span className="text-sumi-200">{matchingGenres}</span>
          </span>
        </div>
      </div>

      {/* Manga Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {similarManga.map((manga, index) => (
          <MangaCard 
            key={manga.id} 
            manga={manga} 
            variant="grid"
            priority={index < 2} // Prioritize first 2 images
          />
        ))}
      </div>

      {/* Mobile genre indicator */}
      <div className="mt-4 sm:hidden flex items-center justify-center gap-2 text-xs text-sumi-500">
        <Sparkles size={12} className="text-kiniro-400/60" />
        Based on {matchingGenres}
      </div>
    </section>
  );
}

export default SimilarMangaSection;
