"use client";

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { usePersonalize } from '@/core/providers';
import { contentstackApi, PersonalizedMangaList } from '@/lib/contentstack';
import { MangaCard } from '@/features/manga';
import { Skeleton } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

// Map of genre preferences to variant IDs
const GENRE_TO_VARIANT: Record<string, string> = {
  action: 'action_readers',
  adventure: 'adventure_readers',
  fantasy: 'fantasy_readers',
  martial_arts: 'martial_arts_readers',
};

interface PersonalizedRecommendationsProps {
  className?: string;
  maxItems?: number;
}

export function PersonalizedRecommendations({ 
  className,
  maxItems = 6 
}: PersonalizedRecommendationsProps) {
  const { genrePreferences, getVariant, isLoading: isPersonalizeLoading, isInitialized } = usePersonalize();
  const [recommendations, setRecommendations] = useState<PersonalizedMangaList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);

      try {
        // Determine which variant to fetch based on user's genre preferences
        let variantId = 'new_users'; // Default for users with no preferences
        
        // Check Personalize for active variant from "past experience" (experience short ID "1")
        const personalizeVariant = getVariant('1');
        if (personalizeVariant) {
          // Map variant short ID to variant_id
          const variantMap: Record<string, string> = {
            '0': 'action_readers',
            '1': 'adventure_readers',
            '2': 'fantasy_readers',
            '3': 'martial_arts_readers',
          };
          variantId = variantMap[personalizeVariant] || variantId;
        } else if (genrePreferences.size > 0) {
          // Fallback: use local genre preferences
          // Pick the first matching genre preference
          const genreArray = Array.from(genrePreferences);
          for (const genre of genreArray) {
            if (GENRE_TO_VARIANT[genre]) {
              variantId = GENRE_TO_VARIANT[genre];
              break;
            }
          }
        }

        console.log('[Recommendations] Fetching for variant:', variantId);

        // Fetch personalized manga list from CMS
        const list = await contentstackApi.getPersonalizedMangaList('recommendations', variantId);
        
        if (list) {
          setRecommendations(list);
          console.log('[Recommendations] Loaded:', list.section_title, 'with', list.manga_list.length, 'items');
        } else {
          // Fallback to new_users variant
          const fallback = await contentstackApi.getPersonalizedMangaList('recommendations', 'new_users');
          setRecommendations(fallback);
        }
      } catch (error) {
        console.error('[Recommendations] Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isPersonalizeLoading) {
      fetchRecommendations();
    }
  }, [isPersonalizeLoading, genrePreferences, getVariant, isInitialized]);

  // Loading skeleton
  if (isLoading || isPersonalizeLoading) {
    return (
      <section className={cn("py-8", className)}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: maxItems }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!recommendations || recommendations.manga_list.length === 0) {
    return null;
  }

  const displayedManga = recommendations.manga_list.slice(0, maxItems);

  return (
    <section className={cn("py-8", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vermillion-500 to-kiniro-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          {recommendations.section_title_jp && (
            <p className="text-sm text-vermillion-500 font-medium">
              {recommendations.section_title_jp}
            </p>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-sumi-900 dark:text-white">
            {recommendations.section_title}
          </h2>
        </div>
        
        {/* Personalized indicator */}
        <span className="ml-auto px-3 py-1 text-xs font-medium bg-vermillion-100 dark:bg-vermillion-900/30 text-vermillion-600 dark:text-vermillion-400 rounded-full">
          Personalized for you
        </span>
      </div>

      {/* Manga Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayedManga.map((manga) => (
          <MangaCard 
            key={manga.id} 
            manga={manga} 
            variant="grid"
          />
        ))}
      </div>
    </section>
  );
}

