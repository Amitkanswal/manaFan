"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Personalize from '@contentstack/personalize-edge-sdk';

// Types for genre weight tracking
interface GenreWeight {
  genre: string;
  count: number;
  lastRead: number; // timestamp
}

// Types for Personalize
interface PersonalizeContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  // Active experiences and variants
  activeVariants: Record<string, string>;
  // Track when user reads a manga (for genre preferences)
  trackMangaRead: (mangaId: string, genres: string[]) => void;
  // Track page views
  trackPageView: (page: string) => void;
  // Get variant for a specific experience
  getVariant: (experienceShortId: string) => string | null;
  // Check if user matches an audience
  isNewUser: boolean;
  isReturningUser: boolean;
  // Genre preferences (which genres user has read) - simple set for backwards compatibility
  genrePreferences: Set<string>;
  // Weighted genre preferences with read counts
  genreWeights: Map<string, number>;
  // Favorite genre (most read)
  favoriteGenre: string | null;
  // Top genres (top 3 most read)
  topGenres: string[];
  // Get all genre weights for recommendations
  getGenreWeightsMap: () => Map<string, number>;
}

const PersonalizeContext = createContext<PersonalizeContextType | null>(null);

// Genre to attribute mapping
const GENRE_ATTRIBUTES: Record<string, string> = {
  action: 'has_read_action',
  adventure: 'has_read_adventure',
  fantasy: 'has_read_fantasy',
  martial_arts: 'has_read_martial_arts',
  comedy: 'has_read_comedy',
  romance: 'has_read_romance',
  supernatural: 'has_read_supernatural',
  horror: 'has_read_horror',
  mystery: 'has_read_mystery',
  slice_of_life: 'has_read_slice_of_life',
  shonen: 'has_read_shonen',
  reincarnation: 'has_read_reincarnation',
  magic: 'has_read_magic',
};

// Normalize genre name to attribute key
function normalizeGenre(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

interface PersonalizeProviderProps {
  children: React.ReactNode;
}

export function PersonalizeProvider({ children }: PersonalizeProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVariants, setActiveVariants] = useState<Record<string, string>>({});
  const [genrePreferences, setGenrePreferences] = useState<Set<string>>(new Set());
  // Weighted genre tracking - genre -> read count
  const [genreWeights, setGenreWeights] = useState<Map<string, number>>(new Map());
  // Track if the actual Personalize SDK is ready (not just local fallback)
  const [isSdkReady, setIsSdkReady] = useState(false);
  const initRef = useRef(false);

  // Initialize Personalize SDK
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const projectUid = process.env.NEXT_PUBLIC_PERSONALIZE_PROJECT_UID;
    
    // Load stored genre preferences from localStorage first (works without Personalize)
    if (typeof window !== 'undefined') {
      // Load simple genre set (backwards compatibility)
      const storedGenres = localStorage.getItem('mangafan_genre_preferences');
      if (storedGenres) {
        try {
          const genres = JSON.parse(storedGenres) as string[];
          setGenrePreferences(new Set(genres));
        } catch (e) {
          console.warn('[Personalize] Could not parse stored genres');
        }
      }
      
      // Load weighted genre preferences
      const storedWeights = localStorage.getItem('mangafan_genre_weights');
      if (storedWeights) {
        try {
          const weights = JSON.parse(storedWeights) as Record<string, number>;
          setGenreWeights(new Map(Object.entries(weights)));
        } catch (e) {
          console.warn('[Personalize] Could not parse stored genre weights');
        }
      }
    }
    
    if (!projectUid) {
      console.warn('[Personalize] No project UID configured - using local personalization only');
      setIsLoading(false);
      setIsInitialized(true); // Still mark as initialized for local fallback
      return;
    }

    const initializePersonalize = async () => {
      try {
        // Initialize the SDK
        await Personalize.init(projectUid);
        
        setIsInitialized(true);
        setIsSdkReady(true); // SDK is actually ready

        // Set attributes for stored genres if we have them
        const storedGenres = localStorage.getItem('mangafan_genre_preferences');
        if (storedGenres) {
          try {
            const genres = JSON.parse(storedGenres) as string[];
            const attributes: Record<string, boolean> = {};
            genres.forEach(genre => {
              const attrKey = GENRE_ATTRIBUTES[normalizeGenre(genre)];
              if (attrKey) {
                attributes[attrKey] = true;
              }
            });
            
            if (Object.keys(attributes).length > 0) {
              Personalize.set(attributes);
            }
          } catch (e) {
            console.warn('[Personalize] Could not set genre attributes');
          }
        }

        // Get active experiences/variants
        try {
          const experiences = Personalize.getExperiences();
          
          // Convert to variant map
          const variants: Record<string, string> = {};
          if (experiences && typeof experiences === 'object') {
            Object.entries(experiences).forEach(([expId, variantId]) => {
              variants[expId] = String(variantId);
            });
          }
          setActiveVariants(variants);
        } catch (expError) {
          console.warn('[Personalize] Could not get experiences (may need to publish them):', expError);
        }

      } catch (err) {
        // 404 error means experiences not published - use local fallback
        console.warn('[Personalize] Initialization failed (experiences may not be published yet):', err);
        setError('Personalize not available - using local personalization');
        setIsInitialized(true); // Still mark as initialized for local fallback
      } finally {
        setIsLoading(false);
      }
    };

    initializePersonalize();
  }, []);

  // Track when user reads a manga
  // Use functional state update to avoid genrePreferences in dependencies
  const trackMangaRead = useCallback((mangaId: string, genres: string[]) => {
    if (!isInitialized) {
      console.warn('[Personalize] SDK not initialized, cannot track manga read');
      return;
    }

    const attributes: Record<string, boolean> = {};

    // Update local genre preferences using functional update (avoids dependency)
    setGenrePreferences(prevGenres => {
      const newGenres = new Set(prevGenres);
      
      genres.forEach(genre => {
        const normalizedGenre = normalizeGenre(genre);
        newGenres.add(normalizedGenre);
        
        const attrKey = GENRE_ATTRIBUTES[normalizedGenre];
        if (attrKey) {
          attributes[attrKey] = true;
        }
      });

      // Save to localStorage
      localStorage.setItem('mangafan_genre_preferences', JSON.stringify(Array.from(newGenres)));
      
      return newGenres;
    });

    // Update weighted genre preferences - increment count for each genre
    setGenreWeights(prevWeights => {
      const newWeights = new Map(prevWeights);
      
      genres.forEach(genre => {
        const normalizedGenre = normalizeGenre(genre);
        const currentCount = newWeights.get(normalizedGenre) || 0;
        newWeights.set(normalizedGenre, currentCount + 1);
      });

      // Save to localStorage as a plain object
      const weightsObj = Object.fromEntries(newWeights);
      localStorage.setItem('mangafan_genre_weights', JSON.stringify(weightsObj));
      
      return newWeights;
    });

    // Only call Personalize SDK methods if SDK is actually ready
    // (not just local fallback mode)
    if (isSdkReady) {
      // Set attributes in Personalize
      genres.forEach(genre => {
        const attrKey = GENRE_ATTRIBUTES[normalizeGenre(genre)];
        if (attrKey) {
          attributes[attrKey] = true;
        }
      });
      
      if (Object.keys(attributes).length > 0) {
        try {
          Personalize.set(attributes);
        } catch (err) {
          console.warn('[Personalize] Error setting attributes:', err);
        }
      }

      // Trigger the past_read event
      try {
        Personalize.triggerEvent('past_read');
      } catch (err) {
        console.warn('[Personalize] Error triggering event:', err);
      }

      // Refresh experiences after attribute change
      setTimeout(async () => {
        try {
          const experiences = Personalize.getExperiences();
          const variants: Record<string, string> = {};
          if (experiences && typeof experiences === 'object') {
            Object.entries(experiences).forEach(([expId, variantId]) => {
              variants[expId] = String(variantId);
            });
          }
          setActiveVariants(variants);
        } catch (err) {
          // Could not refresh experiences
        }
      }, 100);
    }
  }, [isInitialized, isSdkReady]); // Added isSdkReady dependency

  // Track page views
  const trackPageView = useCallback((page: string) => {
    if (!isInitialized) return;
    
    try {
      // Could be used for analytics
    } catch (err) {
      // Error tracking page view
    }
  }, [isInitialized]);

  // Get variant for a specific experience
  const getVariant = useCallback((experienceShortId: string): string | null => {
    return activeVariants[experienceShortId] || null;
  }, [activeVariants]);

  // Track returning user state
  const [isReturningUserState, setIsReturningUserState] = useState(false);

  // Check if user is returning on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isReturning = localStorage.getItem('mangafan_returning_user') === 'true';
      const hasGenres = localStorage.getItem('mangafan_genre_preferences');
      
      // User is returning if they have the flag OR have read any manga (has genre preferences)
      if (isReturning || hasGenres) {
        setIsReturningUserState(true);
      }
    }
  }, []);

  // Mark user as returning after they visit any page (immediate, not delayed)
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      // Set the returning flag immediately on first init
      localStorage.setItem('mangafan_returning_user', 'true');
    }
  }, [isInitialized]);

  // Derived state
  const isNewUser = !isReturningUserState;
  const isReturningUser = isReturningUserState;

  // Calculate favorite genre (most read)
  const favoriteGenre = React.useMemo(() => {
    if (genreWeights.size === 0) return null;
    
    let maxGenre: string | null = null;
    let maxCount = 0;
    
    genreWeights.forEach((count, genre) => {
      if (count > maxCount) {
        maxCount = count;
        maxGenre = genre;
      }
    });
    
    return maxGenre;
  }, [genreWeights]);

  // Calculate top genres (top 3 most read)
  const topGenres = React.useMemo(() => {
    if (genreWeights.size === 0) return [];
    
    const sorted = Array.from(genreWeights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
    
    return sorted;
  }, [genreWeights]);

  // Get genre weights map for recommendations API
  const getGenreWeightsMap = useCallback(() => {
    return new Map(genreWeights);
  }, [genreWeights]);

  const value: PersonalizeContextType = {
    isInitialized,
    isLoading,
    error,
    activeVariants,
    trackMangaRead,
    trackPageView,
    getVariant,
    isNewUser,
    isReturningUser,
    genrePreferences,
    genreWeights,
    favoriteGenre,
    topGenres,
    getGenreWeightsMap,
  };

  return (
    <PersonalizeContext.Provider value={value}>
      {children}
    </PersonalizeContext.Provider>
  );
}

// Default safe values for SSR/build time
const DEFAULT_PERSONALIZE_CONTEXT: PersonalizeContextType = {
  isInitialized: false,
  isLoading: true,
  error: null,
  activeVariants: {},
  trackMangaRead: () => {},
  trackPageView: () => {},
  getVariant: () => null,
  isNewUser: true,
  isReturningUser: false,
  genrePreferences: new Set(),
  genreWeights: new Map(),
  favoriteGenre: null,
  topGenres: [],
  getGenreWeightsMap: () => new Map(),
};

export function usePersonalize() {
  const context = useContext(PersonalizeContext);
  // Return default safe values if context is not available (SSR/build)
  if (!context) {
    return DEFAULT_PERSONALIZE_CONTEXT;
  }
  return context;
}

// Hook to get personalized content variant
export function usePersonalizedVariant(experienceShortId: string) {
  const { getVariant, isLoading, isInitialized } = usePersonalize();
  const variant = getVariant(experienceShortId);
  
  return {
    variant,
    isLoading,
    isReady: isInitialized && !isLoading,
  };
}

// Hook to track manga reads
export function useTrackMangaRead() {
  const { trackMangaRead, isInitialized } = usePersonalize();
  
  return useCallback((mangaId: string, genres: string[]) => {
    if (isInitialized) {
      trackMangaRead(mangaId, genres);
    }
  }, [trackMangaRead, isInitialized]);
}

// Hook to get user's genre preferences with weights
export function useGenrePreferences() {
  const { 
    genrePreferences, 
    genreWeights, 
    favoriteGenre, 
    topGenres,
    getGenreWeightsMap,
    isInitialized 
  } = usePersonalize();
  
  return {
    // Simple set of genres user has read
    genres: genrePreferences,
    // Map of genre -> read count
    weights: genreWeights,
    // Most read genre
    favoriteGenre,
    // Top 3 genres
    topGenres,
    // Get weights as Map for API calls
    getWeightsMap: getGenreWeightsMap,
    // Whether the data is loaded
    isReady: isInitialized,
  };
}

// Hook to get recommended variant ID based on favorite genre
export function useGenreBasedVariant() {
  const { favoriteGenre, isInitialized } = usePersonalize();
  
  // Map favorite genre to variant ID for personalized content
  const variantMap: Record<string, string> = {
    action: 'action_readers',
    adventure: 'adventure_readers',
    fantasy: 'fantasy_readers',
    martial_arts: 'martial_arts_readers',
    comedy: 'comedy_readers',
    romance: 'romance_readers',
    supernatural: 'supernatural_readers',
    horror: 'horror_readers',
    mystery: 'mystery_readers',
    slice_of_life: 'slice_of_life_readers',
    shonen: 'shonen_readers',
    reincarnation: 'reincarnation_readers',
    magic: 'magic_readers',
  };

  const variantId = favoriteGenre ? variantMap[favoriteGenre] || 'new_users' : 'new_users';
  
  return {
    variantId,
    favoriteGenre,
    isReady: isInitialized,
  };
}

