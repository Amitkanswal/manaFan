import { Manga } from '@/types';
import { MOCK_DB } from '../mock-data';

// This service is designed to be easily swapped with a real API call (e.g., fetch/axios)
export const MangaService = {
  async getMangaList(): Promise<Manga[]> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    return MOCK_DB.manga;
  },

  async getMangaById(id: string): Promise<Manga | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_DB.manga.find(m => m.id === id) || null;
  },

  async searchManga(query: string): Promise<Manga[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const lowerQuery = query.toLowerCase();
    return MOCK_DB.manga.filter(m => 
      m.title.toLowerCase().includes(lowerQuery) || 
      m.author.toLowerCase().includes(query)
    );
  }
};

