"use client";

import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';

// Types for user library data
export interface ReadingProgress {
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string;
  lastChapterSlug: string;
  lastChapterNumber: number;
  lastChapterTitle: string;
  totalChapters: number;
  lastReadAt: string; // ISO date string
}

export interface FollowedManga {
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string;
  followedAt: string;
}

export interface BookmarkedManga {
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string;
  bookmarkedAt: string;
}

export interface ReadingHistoryItem {
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string;
  chapterSlug: string;
  chapterNumber: number;
  chapterTitle: string;
  readAt: string;
}

export interface UserRating {
  mangaSlug: string;
  rating: number;
  ratedAt: string;
}

interface UserLibraryData {
  readingProgress: Record<string, ReadingProgress>;
  followed: Record<string, FollowedManga>;
  bookmarked: Record<string, BookmarkedManga>;
  history: ReadingHistoryItem[];
  ratings: Record<string, UserRating>;
}

const DEFAULT_LIBRARY_DATA: UserLibraryData = {
  readingProgress: {},
  followed: {},
  bookmarked: {},
  history: [],
  ratings: {},
};

interface UserLibraryContextValue {
  // Data
  readingProgress: Record<string, ReadingProgress>;
  followed: Record<string, FollowedManga>;
  bookmarked: Record<string, BookmarkedManga>;
  history: ReadingHistoryItem[];
  ratings: Record<string, UserRating>;
  isLoaded: boolean;

  // Actions - Following
  followManga: (manga: { slug: string; title: string; cover: string }) => void;
  unfollowManga: (mangaSlug: string) => void;
  isFollowing: (mangaSlug: string) => boolean;

  // Actions - Bookmarking
  bookmarkManga: (manga: { slug: string; title: string; cover: string }) => void;
  removeBookmark: (mangaSlug: string) => void;
  isBookmarked: (mangaSlug: string) => boolean;

  // Actions - Reading Progress
  updateReadingProgress: (progress: {
    mangaSlug: string;
    mangaTitle: string;
    mangaCover: string;
    chapterSlug: string;
    chapterNumber: number;
    chapterTitle: string;
    totalChapters: number;
  }) => void;
  getProgress: (mangaSlug: string) => ReadingProgress | null;
  getUnreadCount: (mangaSlug: string, totalChapters: number) => number;

  // Actions - History
  addToHistory: (item: Omit<ReadingHistoryItem, 'readAt'>) => void;
  clearHistory: () => void;

  // Actions - Ratings
  rateManga: (mangaSlug: string, rating: number) => void;
  getRating: (mangaSlug: string) => number | null;

  // Utility
  clearAllData: () => void;
}

const UserLibraryContext = createContext<UserLibraryContextValue | null>(null);

const STORAGE_KEY = 'mangafan_user_library';
const MAX_HISTORY_ITEMS = 50;

export function UserLibraryProvider({ children }: { children: ReactNode }) {
  const { value: data, setValue: setData, isLoaded } = useLocalStorage<UserLibraryData>(
    STORAGE_KEY,
    DEFAULT_LIBRARY_DATA
  );

  // === FOLLOW ACTIONS ===
  const followManga = useCallback((manga: { slug: string; title: string; cover: string }) => {
    setData(prev => ({
      ...prev,
      followed: {
        ...prev.followed,
        [manga.slug]: {
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
          mangaCover: manga.cover,
          followedAt: new Date().toISOString(),
        },
      },
      // Also add to bookmarks when following
      bookmarked: {
        ...prev.bookmarked,
        [manga.slug]: {
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
          mangaCover: manga.cover,
          bookmarkedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setData]);

  const unfollowManga = useCallback((mangaSlug: string) => {
    setData(prev => {
      const { [mangaSlug]: removed, ...remainingFollowed } = prev.followed;
      return { ...prev, followed: remainingFollowed };
    });
  }, [setData]);

  const isFollowing = useCallback((mangaSlug: string): boolean => {
    return mangaSlug in data.followed;
  }, [data.followed]);

  // === BOOKMARK ACTIONS ===
  const bookmarkManga = useCallback((manga: { slug: string; title: string; cover: string }) => {
    setData(prev => ({
      ...prev,
      bookmarked: {
        ...prev.bookmarked,
        [manga.slug]: {
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
          mangaCover: manga.cover,
          bookmarkedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setData]);

  const removeBookmark = useCallback((mangaSlug: string) => {
    setData(prev => {
      const { [mangaSlug]: removedBookmark, ...remainingBookmarked } = prev.bookmarked;
      const { [mangaSlug]: removedFollow, ...remainingFollowed } = prev.followed;
      return { 
        ...prev, 
        bookmarked: remainingBookmarked,
        followed: remainingFollowed, // Also unfollow when removing bookmark
      };
    });
  }, [setData]);

  const isBookmarked = useCallback((mangaSlug: string): boolean => {
    return mangaSlug in data.bookmarked;
  }, [data.bookmarked]);

  // === READING PROGRESS ACTIONS ===
  const updateReadingProgress = useCallback((progress: {
    mangaSlug: string;
    mangaTitle: string;
    mangaCover: string;
    chapterSlug: string;
    chapterNumber: number;
    chapterTitle: string;
    totalChapters: number;
  }) => {
    const existingProgress = data.readingProgress[progress.mangaSlug];
    
    // Only update if reading a higher chapter number
    if (existingProgress && existingProgress.lastChapterNumber >= progress.chapterNumber) {
      return;
    }

    setData(prev => ({
      ...prev,
      readingProgress: {
        ...prev.readingProgress,
        [progress.mangaSlug]: {
          mangaSlug: progress.mangaSlug,
          mangaTitle: progress.mangaTitle,
          mangaCover: progress.mangaCover,
          lastChapterSlug: progress.chapterSlug,
          lastChapterNumber: progress.chapterNumber,
          lastChapterTitle: progress.chapterTitle,
          totalChapters: progress.totalChapters,
          lastReadAt: new Date().toISOString(),
        },
      },
    }));
  }, [data.readingProgress, setData]);

  const getProgress = useCallback((mangaSlug: string): ReadingProgress | null => {
    return data.readingProgress[mangaSlug] || null;
  }, [data.readingProgress]);

  const getUnreadCount = useCallback((mangaSlug: string, totalChapters: number): number => {
    const progress = data.readingProgress[mangaSlug];
    if (!progress) return totalChapters;
    return Math.max(0, totalChapters - progress.lastChapterNumber);
  }, [data.readingProgress]);

  // === HISTORY ACTIONS ===
  const addToHistory = useCallback((item: Omit<ReadingHistoryItem, 'readAt'>) => {
    setData(prev => {
      // Remove duplicate if exists
      const filteredHistory = prev.history.filter(
        h => !(h.mangaSlug === item.mangaSlug && h.chapterSlug === item.chapterSlug)
      );
      
      // Add new item at the beginning
      const newHistory = [
        { ...item, readAt: new Date().toISOString() },
        ...filteredHistory,
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only last N items

      return { ...prev, history: newHistory };
    });
  }, [setData]);

  const clearHistory = useCallback(() => {
    setData(prev => ({ ...prev, history: [] }));
  }, [setData]);

  // === RATING ACTIONS ===
  const rateManga = useCallback((mangaSlug: string, rating: number) => {
    setData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [mangaSlug]: {
          mangaSlug,
          rating,
          ratedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setData]);

  const getRating = useCallback((mangaSlug: string): number | null => {
    return data.ratings[mangaSlug]?.rating || null;
  }, [data.ratings]);

  // === UTILITY ACTIONS ===
  const clearAllData = useCallback(() => {
    setData(DEFAULT_LIBRARY_DATA);
  }, [setData]);

  // Memoize context value
  const contextValue = useMemo<UserLibraryContextValue>(() => ({
    readingProgress: data.readingProgress,
    followed: data.followed,
    bookmarked: data.bookmarked,
    history: data.history,
    ratings: data.ratings,
    isLoaded,
    followManga,
    unfollowManga,
    isFollowing,
    bookmarkManga,
    removeBookmark,
    isBookmarked,
    updateReadingProgress,
    getProgress,
    getUnreadCount,
    addToHistory,
    clearHistory,
    rateManga,
    getRating,
    clearAllData,
  }), [
    data,
    isLoaded,
    followManga,
    unfollowManga,
    isFollowing,
    bookmarkManga,
    removeBookmark,
    isBookmarked,
    updateReadingProgress,
    getProgress,
    getUnreadCount,
    addToHistory,
    clearHistory,
    rateManga,
    getRating,
    clearAllData,
  ]);

  return (
    <UserLibraryContext.Provider value={contextValue}>
      {children}
    </UserLibraryContext.Provider>
  );
}

// Default safe values for SSR/build time
const DEFAULT_CONTEXT: UserLibraryContextValue = {
  readingProgress: {},
  followed: {},
  bookmarked: {},
  history: [],
  ratings: {},
  isLoaded: false,
  followManga: () => {},
  unfollowManga: () => {},
  isFollowing: () => false,
  bookmarkManga: () => {},
  removeBookmark: () => {},
  isBookmarked: () => false,
  updateReadingProgress: () => {},
  getProgress: () => null,
  getUnreadCount: () => 0,
  addToHistory: () => {},
  clearHistory: () => {},
  rateManga: () => {},
  getRating: () => null,
  clearAllData: () => {},
};

export function useUserLibrary() {
  const context = useContext(UserLibraryContext);
  // Return default safe values if context is not available (SSR/build)
  if (!context) {
    return DEFAULT_CONTEXT;
  }
  return context;
}

// Convenience hooks for specific features
export function useFollow(mangaSlug: string) {
  const { isFollowing, followManga, unfollowManga } = useUserLibrary();
  const following = isFollowing(mangaSlug);
  
  return {
    isFollowing: following,
    toggle: (manga: { slug: string; title: string; cover: string }) => {
      if (following) {
        unfollowManga(mangaSlug);
      } else {
        followManga(manga);
      }
    },
  };
}

export function useBookmark(mangaSlug: string) {
  const { isBookmarked, bookmarkManga, removeBookmark } = useUserLibrary();
  const bookmarked = isBookmarked(mangaSlug);
  
  return {
    isBookmarked: bookmarked,
    toggle: (manga: { slug: string; title: string; cover: string }) => {
      if (bookmarked) {
        removeBookmark(mangaSlug);
      } else {
        bookmarkManga(manga);
      }
    },
  };
}

export function useMangaRating(mangaSlug: string) {
  const { getRating, rateManga } = useUserLibrary();
  const rating = getRating(mangaSlug);
  
  return {
    rating,
    rate: (newRating: number) => rateManga(mangaSlug, newRating),
  };
}

