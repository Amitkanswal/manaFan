"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useAuth } from './auth-provider';
import {
  bookmarksApi,
  ratingsApi,
  subscriptionsApi,
  readingProgressApi,
  viewsApi,
} from '@/lib/api/client';

// Types
interface Bookmark {
  id: string;
  mangaUid: string;
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string | null;
  createdAt: string;
}

interface Rating {
  id: string;
  mangaUid: string;
  mangaSlug: string;
  rating: number;
  createdAt: string;
}

interface Subscription {
  id: string;
  mangaUid: string;
  mangaSlug: string;
  mangaTitle: string;
  notifyNewChapter: boolean;
  createdAt: string;
}

interface ReadingProgress {
  id: string;
  mangaUid: string;
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string | null;
  lastChapterUid: string;
  lastChapterSlug: string;
  lastChapterNumber: number;
  lastChapterTitle: string;
  totalChapters: number;
  lastReadAt: string;
}

interface BackendLibraryState {
  bookmarks: Record<string, Bookmark>;
  ratings: Record<string, Rating>;
  subscriptions: Record<string, Subscription>;
  readingProgress: Record<string, ReadingProgress>;
  isLoading: boolean;
  isSynced: boolean;
}

interface BackendLibraryContextValue extends BackendLibraryState {
  // Bookmarks
  addBookmark: (manga: { mangaUid: string; mangaSlug: string; mangaTitle: string; mangaCover?: string }) => Promise<boolean>;
  removeBookmark: (mangaUid: string) => Promise<boolean>;
  isBookmarked: (mangaUid: string) => boolean;

  // Ratings
  rateManga: (mangaUid: string, mangaSlug: string, rating: number) => Promise<boolean>;
  getRating: (mangaUid: string) => number | null;

  // Subscriptions
  subscribe: (manga: { mangaUid: string; mangaSlug: string; mangaTitle: string }) => Promise<boolean>;
  unsubscribe: (mangaUid: string) => Promise<boolean>;
  isSubscribed: (mangaUid: string) => boolean;

  // Reading Progress
  updateProgress: (data: {
    mangaUid: string;
    mangaSlug: string;
    mangaTitle: string;
    mangaCover?: string;
    chapterUid: string;
    chapterSlug: string;
    chapterNumber: number;
    chapterTitle?: string;
    totalChapters?: number;
  }) => Promise<boolean>;
  getProgress: (mangaUid: string) => ReadingProgress | null;

  // Views (works for guests)
  trackView: (data: { mangaUid: string; mangaSlug: string; chapterUid?: string; chapterSlug?: string }) => Promise<void>;

  // Sync
  refreshLibrary: () => Promise<void>;
}

const BackendLibraryContext = createContext<BackendLibraryContextValue | null>(null);

export function BackendLibraryProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [state, setState] = useState<BackendLibraryState>({
    bookmarks: {},
    ratings: {},
    subscriptions: {},
    readingProgress: {},
    isLoading: true,
    isSynced: false,
  });

  // Fetch all library data when authenticated
  const fetchLibrary = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false, isSynced: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [bookmarksRes, ratingsRes, subsRes, progressRes] = await Promise.all([
        bookmarksApi.getAll(token),
        ratingsApi.getAll(token),
        subscriptionsApi.getAll(token),
        readingProgressApi.getAll(token),
      ]);

      const bookmarks: Record<string, Bookmark> = {};
      const ratings: Record<string, Rating> = {};
      const subscriptions: Record<string, Subscription> = {};
      const readingProgress: Record<string, ReadingProgress> = {};

      bookmarksRes.data?.bookmarks?.forEach(b => {
        bookmarks[b.mangaUid] = b;
      });

      ratingsRes.data?.ratings?.forEach(r => {
        ratings[r.mangaUid] = r;
      });

      subsRes.data?.subscriptions?.forEach(s => {
        subscriptions[s.mangaUid] = s;
      });

      progressRes.data?.progress?.forEach(p => {
        readingProgress[p.mangaUid] = p;
      });

      setState({
        bookmarks,
        ratings,
        subscriptions,
        readingProgress,
        isLoading: false,
        isSynced: true,
      });
    } catch (error) {
      console.error('Failed to fetch library:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token]);

  // Fetch library when auth changes
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchLibrary();
      } else {
        // Clear library data on logout
        setState({
          bookmarks: {},
          ratings: {},
          subscriptions: {},
          readingProgress: {},
          isLoading: false,
          isSynced: false,
        });
      }
    }
  }, [isAuthenticated, authLoading, fetchLibrary]);

  // ============================================
  // BOOKMARKS
  // ============================================

  const addBookmark = useCallback(async (manga: {
    mangaUid: string;
    mangaSlug: string;
    mangaTitle: string;
    mangaCover?: string;
  }): Promise<boolean> => {
    if (!token) return false;

    const response = await bookmarksApi.add(token, manga);
    if (response.data?.bookmark) {
      setState(prev => ({
        ...prev,
        bookmarks: {
          ...prev.bookmarks,
          [manga.mangaUid]: response.data!.bookmark,
        },
      }));
      return true;
    }
    return false;
  }, [token]);

  const removeBookmark = useCallback(async (mangaUid: string): Promise<boolean> => {
    if (!token) return false;

    const response = await bookmarksApi.remove(token, mangaUid);
    if (!response.error) {
      setState(prev => {
        const { [mangaUid]: _, ...remaining } = prev.bookmarks;
        return { ...prev, bookmarks: remaining };
      });
      return true;
    }
    return false;
  }, [token]);

  const isBookmarked = useCallback((mangaUid: string): boolean => {
    return mangaUid in state.bookmarks;
  }, [state.bookmarks]);

  // ============================================
  // RATINGS
  // ============================================

  const rateManga = useCallback(async (
    mangaUid: string,
    mangaSlug: string,
    rating: number
  ): Promise<boolean> => {
    if (!token) return false;

    const response = await ratingsApi.rate(token, { mangaUid, mangaSlug, rating });
    if (response.data?.rating) {
      setState(prev => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [mangaUid]: response.data!.rating,
        },
      }));
      return true;
    }
    return false;
  }, [token]);

  const getRating = useCallback((mangaUid: string): number | null => {
    return state.ratings[mangaUid]?.rating ?? null;
  }, [state.ratings]);

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  const subscribe = useCallback(async (manga: {
    mangaUid: string;
    mangaSlug: string;
    mangaTitle: string;
  }): Promise<boolean> => {
    if (!token) return false;

    const response = await subscriptionsApi.subscribe(token, manga);
    if (response.data?.subscription) {
      setState(prev => ({
        ...prev,
        subscriptions: {
          ...prev.subscriptions,
          [manga.mangaUid]: response.data!.subscription,
        },
      }));
      return true;
    }
    return false;
  }, [token]);

  const unsubscribe = useCallback(async (mangaUid: string): Promise<boolean> => {
    if (!token) return false;

    const response = await subscriptionsApi.unsubscribe(token, mangaUid);
    if (!response.error) {
      setState(prev => {
        const { [mangaUid]: _, ...remaining } = prev.subscriptions;
        return { ...prev, subscriptions: remaining };
      });
      return true;
    }
    return false;
  }, [token]);

  const isSubscribed = useCallback((mangaUid: string): boolean => {
    return mangaUid in state.subscriptions;
  }, [state.subscriptions]);

  // ============================================
  // READING PROGRESS
  // ============================================

  const updateProgress = useCallback(async (data: {
    mangaUid: string;
    mangaSlug: string;
    mangaTitle: string;
    mangaCover?: string;
    chapterUid: string;
    chapterSlug: string;
    chapterNumber: number;
    chapterTitle?: string;
    totalChapters?: number;
  }): Promise<boolean> => {
    if (!token) return false;

    const response = await readingProgressApi.update(token, data);
    if (response.data?.progress) {
      setState(prev => ({
        ...prev,
        readingProgress: {
          ...prev.readingProgress,
          [data.mangaUid]: response.data!.progress,
        },
      }));
      return true;
    }
    return false;
  }, [token]);

  const getProgress = useCallback((mangaUid: string): ReadingProgress | null => {
    return state.readingProgress[mangaUid] ?? null;
  }, [state.readingProgress]);

  // ============================================
  // VIEWS
  // ============================================

  const trackView = useCallback(async (data: {
    mangaUid: string;
    mangaSlug: string;
    chapterUid?: string;
    chapterSlug?: string;
  }): Promise<void> => {
    // Track view for both guests and authenticated users
    await viewsApi.track(data, token || undefined);
  }, [token]);

  // ============================================
  // SYNC
  // ============================================

  const refreshLibrary = useCallback(async () => {
    await fetchLibrary();
  }, [fetchLibrary]);

  const contextValue = useMemo<BackendLibraryContextValue>(() => ({
    ...state,
    addBookmark,
    removeBookmark,
    isBookmarked,
    rateManga,
    getRating,
    subscribe,
    unsubscribe,
    isSubscribed,
    updateProgress,
    getProgress,
    trackView,
    refreshLibrary,
  }), [
    state,
    addBookmark,
    removeBookmark,
    isBookmarked,
    rateManga,
    getRating,
    subscribe,
    unsubscribe,
    isSubscribed,
    updateProgress,
    getProgress,
    trackView,
    refreshLibrary,
  ]);

  return (
    <BackendLibraryContext.Provider value={contextValue}>
      {children}
    </BackendLibraryContext.Provider>
  );
}

// Default safe values for SSR/build time
const DEFAULT_BACKEND_LIBRARY_CONTEXT: BackendLibraryContextValue = {
  bookmarks: {},
  ratings: {},
  subscriptions: {},
  readingProgress: {},
  isLoading: true,
  isSynced: false,
  addBookmark: async () => false,
  removeBookmark: async () => false,
  isBookmarked: () => false,
  rateManga: async () => false,
  getRating: () => null,
  subscribe: async () => false,
  unsubscribe: async () => false,
  isSubscribed: () => false,
  updateProgress: async () => false,
  getProgress: () => null,
  trackView: async () => {},
  refreshLibrary: async () => {},
};

export function useBackendLibrary() {
  const context = useContext(BackendLibraryContext);
  // Return default safe values if context is not available (SSR/build)
  if (!context) {
    return DEFAULT_BACKEND_LIBRARY_CONTEXT;
  }
  return context;
}

// Convenience hooks
export function useBookmarks() {
  const { bookmarks, addBookmark, removeBookmark, isBookmarked, isLoading } = useBackendLibrary();
  return { bookmarks, addBookmark, removeBookmark, isBookmarked, isLoading };
}

export function useRatings() {
  const { ratings, rateManga, getRating, isLoading } = useBackendLibrary();
  return { ratings, rateManga, getRating, isLoading };
}

export function useSubscriptions() {
  const { subscriptions, subscribe, unsubscribe, isSubscribed, isLoading } = useBackendLibrary();
  return { subscriptions, subscribe, unsubscribe, isSubscribed, isLoading };
}

export function useReadingProgress() {
  const { readingProgress, updateProgress, getProgress, isLoading } = useBackendLibrary();
  return { readingProgress, updateProgress, getProgress, isLoading };
}

