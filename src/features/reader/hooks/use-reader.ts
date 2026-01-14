"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chapter } from '@/features/manga';
import { Page, ReaderSettings, defaultReaderSettings } from '../types';
import { delay } from '@/shared/lib/utils';

/**
 * Hook to fetch chapter pages
 */
export function useChapterPages(mangaId: string | null, chapterId: string | null) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mangaId || !chapterId) {
      setPages([]);
      return;
    }

    const fetchPages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Replace with actual API call
        await delay(500);
        
        // Mock pages
        const mockPages: Page[] = Array.from({ length: 12 }, (_, i) => ({
          id: i,
          url: `https://placehold.co/800x1200/1a1a1a/FFF?text=Page+${i + 1}`,
          number: i + 1,
        }));
        
        setPages(mockPages);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load pages'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [mangaId, chapterId]);

  return { pages, isLoading, error };
}

/**
 * Hook to manage reader settings
 */
export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(defaultReaderSettings);

  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultReaderSettings);
  }, []);

  return { settings, updateSettings, resetSettings };
}

/**
 * Hook to manage chapter navigation
 */
export function useChapterNavigation(chapters: Chapter[], currentChapterId: string | null) {
  const currentIndex = useMemo(() => 
    chapters.findIndex(c => c.id === currentChapterId),
    [chapters, currentChapterId]
  );

  const hasNext = currentIndex > 0;
  const hasPrev = currentIndex < chapters.length - 1;

  const nextChapter = hasNext ? chapters[currentIndex - 1] : null;
  const prevChapter = hasPrev ? chapters[currentIndex + 1] : null;

  return { currentIndex, hasNext, hasPrev, nextChapter, prevChapter };
}

