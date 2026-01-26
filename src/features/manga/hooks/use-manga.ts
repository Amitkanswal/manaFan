"use client";

import { useState, useEffect } from 'react';
import { Manga, Chapter, MangaFilters, GenreTerm, StatusTerm } from '../types';
import { contentstackApi } from '@/lib/contentstack';
import { mangaApi as mockApi } from '../services/api';

// Flag to toggle between CMS and mock data
const USE_CMS = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN && 
                process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN !== 'YOUR_DELIVERY_TOKEN_HERE';

// Flag to use CMA API routes (new approach) - only enable when env var is set
// Set NEXT_PUBLIC_USE_CMA=true in .env.local to enable CMA
const USE_CMA = process.env.NEXT_PUBLIC_USE_CMA === 'true';

export function useMangaList(filters?: MangaFilters) {
  const [data, setData] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const filterKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let result: Manga[];
        
        if (USE_CMA) {
          // Use new CMA-based API routes
          const hasFilters = filters?.genre || filters?.status || filters?.statusTermUid;
          
          if (hasFilters) {
            // Use taxonomy filter endpoint when filters are applied
            const params = new URLSearchParams();
            if (filters?.genre) params.append('genre', filters.genre);
            // Use statusTermUid if available, otherwise convert status name to termUid
            if (filters?.statusTermUid) {
              params.append('status', filters.statusTermUid);
            } else if (filters?.status) {
              params.append('status', filters.status.toLowerCase());
            }
            if (filters?.searchQuery) params.append('search', filters.searchQuery);
            
            const response = await fetch(`/api/manga/filter?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch filtered manga');
            const data = await response.json();
            result = data.entries || [];
          } else {
            // Use entries endpoint for all manga (no filters)
            const params = new URLSearchParams();
            if (filters?.searchQuery) params.append('search', filters.searchQuery);
            
            const response = await fetch(`/api/manga/entries?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch manga entries');
            const data = await response.json();
            result = data.entries || [];
          }
        } else if (USE_CMS) {
          result = await contentstackApi.getMangaList(filters);
        } else {
          result = await mockApi.getAll(filters);
        }
        
        setData(result);
      } catch (err) {
        console.error('Error fetching manga list:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch manga'));
        try {
          // Fallback to delivery SDK or mock data
          if (USE_CMS) {
            const fallback = await contentstackApi.getMangaList(filters);
            setData(fallback);
          } else {
            const fallback = await mockApi.getAll(filters);
            setData(fallback);
          }
        } catch {
          setData([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterKey]);

  return { data, isLoading, error };
}

export function useManga(id: string) {
  const [data, setData] = useState<Manga | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let result: Manga | null;
        
        if (USE_CMS) {
          result = await contentstackApi.getMangaById(id);
        } else {
          result = await mockApi.getById(id);
        }
        
        setData(result);
      } catch (err) {
        console.error('Error fetching manga:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch manga'));
        try {
          const fallback = await mockApi.getById(id);
          setData(fallback);
        } catch {
          setData(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, isLoading, error };
}

export function useMangaBySlug(slug: string) {
  const [data, setData] = useState<Manga | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let result: Manga | null;
        
        if (USE_CMS) {
          result = await contentstackApi.getMangaBySlug(slug);
        } else {
          result = await mockApi.getBySlug(slug);
        }
        
        setData(result);
      } catch (err) {
        console.error('Error fetching manga by slug:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch manga'));
        try {
          const fallback = await mockApi.getBySlug(slug);
          setData(fallback);
        } catch {
          setData(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  return { data, isLoading, error };
}

export function useGenres() {
  const [data, setData] = useState<GenreTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (USE_CMA) {
          // Fetch genres from CMA taxonomy API
          const response = await fetch('/api/manga/taxonomies?type=genre');
          if (!response.ok) throw new Error('Failed to fetch genres');
          const result = await response.json();
          setData(result.genres || []);
        } else if (USE_CMS) {
          // Fetch genres from Contentstack taxonomy
          const result = await contentstackApi.getGenres();
          setData(result);
        } else {
          // Fallback to mock genres with generated termUids
          const mockGenres = await mockApi.getGenres();
          const genreTerms: GenreTerm[] = mockGenres.map(name => ({
            name,
            termUid: name.toLowerCase().replace(/\s+/g, '_')
          }));
          setData(genreTerms);
        }
      } catch (err) {
        console.error('Error fetching genres:', err);
        try {
          // Fallback to delivery SDK
          if (USE_CMS) {
            const result = await contentstackApi.getGenres();
            setData(result);
          } else {
            const fallbackGenres = await mockApi.getGenres();
            const genreTerms: GenreTerm[] = fallbackGenres.map(name => ({
              name,
              termUid: name.toLowerCase().replace(/\s+/g, '_')
            }));
            setData(genreTerms);
          }
        } catch {
          setData([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading };
}

export function useStatuses() {
  const [data, setData] = useState<StatusTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (USE_CMA) {
          // Fetch statuses from CMA taxonomy API
          const response = await fetch('/api/manga/taxonomies?type=status');
          if (!response.ok) throw new Error('Failed to fetch statuses');
          const result = await response.json();
          setData(result.statuses || []);
        } else if (USE_CMS) {
          const result = await contentstackApi.getStatuses();
          setData(result);
        } else {
          // Default statuses
          const defaultStatuses: StatusTerm[] = [
            { name: 'Ongoing', termUid: 'ongoing' },
            { name: 'Completed', termUid: 'completed' },
            { name: 'Hiatus', termUid: 'hiatus' },
          ];
          setData(defaultStatuses);
        }
      } catch (err) {
        console.error('Error fetching statuses:', err);
        setData([
          { name: 'Ongoing', termUid: 'ongoing' },
          { name: 'Completed', termUid: 'completed' },
          { name: 'Hiatus', termUid: 'hiatus' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading };
}

export function useChapter(mangaId: string, chapterId: string) {
  const [data, setData] = useState<{ manga: Manga; chapter: Chapter; pages: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mangaId || !chapterId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let result;
        
        if (USE_CMS) {
          // For CMS, use the old method for now
          const mangaList = await contentstackApi.getMangaList();
          const manga = mangaList.find(m => m.id === mangaId);
          if (manga) {
            const chapter = manga.chapters.find(c => c.id === chapterId);
            if (chapter) {
              result = { manga, chapter, pages: [] as string[] };
            }
          }
        } else {
          result = await mockApi.getChapter(mangaId, chapterId);
        }
        
        setData(result || null);
      } catch (err) {
        console.error('Error fetching chapter:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch chapter'));
        try {
          const fallback = await mockApi.getChapter(mangaId, chapterId);
          setData(fallback);
        } catch {
          setData(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [mangaId, chapterId]);

  return { data, isLoading, error };
}

export function useChapterBySlug(mangaSlug: string, chapterNumber: number) {
  const [data, setData] = useState<{ manga: Manga; chapter: Chapter; pages: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mangaSlug || !chapterNumber) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let result;
        
        if (USE_CMS) {
          result = await contentstackApi.getChapterBySlug(mangaSlug, chapterNumber);
        } else {
          result = await mockApi.getChapterBySlug(mangaSlug, chapterNumber);
        }
        
        setData(result);
      } catch (err) {
        console.error('Error fetching chapter by slug:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch chapter'));
        try {
          const fallback = await mockApi.getChapterBySlug(mangaSlug, chapterNumber);
          setData(fallback);
        } catch {
          setData(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [mangaSlug, chapterNumber]);

  return { data, isLoading, error };
}
