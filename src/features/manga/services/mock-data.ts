import { Manga } from '../types';

// Base manga data without slugs (slugs will be generated)
type BaseManga = Omit<Manga, 'slug' | 'chapters'> & {
  chapters: Omit<Manga['chapters'][0], 'slug'>[];
};

const BASE_MOCK_MANGA: BaseManga[] = [
  {
    id: 'm1',
    title: 'Solo Leveling: Arise',
    author: 'Chugong',
    cover: 'https://placehold.co/300x450/1a1a1a/FFF?text=Solo+Leveling',
    banner: 'https://placehold.co/1200x400/2a2a2a/FFF?text=Solo+Leveling+Banner',
    synopsis: 'In a world where hunters must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival.',
    rating: 4.9,
    views: '12.5M',
    status: 'Ongoing',
    updatedAt: '2024-05-20',
    genres: ['Action', 'Fantasy', 'Adventure'],
    readers: 2450000,
    followers: 890000,
    chapters: Array.from({ length: 150 }, (_, i) => ({
      id: `c${150 - i}`,
      number: 150 - i,
      title: `Chapter ${150 - i}`,
      date: '2024-05-20'
    }))
  },
  {
    id: 'm2',
    title: 'The Beginning After The End',
    author: 'TurtleMe',
    cover: 'https://placehold.co/300x450/3b2f2f/FFF?text=TBATE',
    banner: 'https://placehold.co/1200x400/4b3f3f/FFF?text=TBATE+Banner',
    synopsis: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power.',
    rating: 4.8,
    views: '8.2M',
    status: 'Hiatus',
    updatedAt: '2024-04-15',
    genres: ['Isekai', 'Magic', 'Reincarnation'],
    readers: 1820000,
    followers: 654000,
    chapters: Array.from({ length: 175 }, (_, i) => ({
      id: `c${175 - i}`,
      number: 175 - i,
      title: `Chapter ${175 - i}`,
      date: '2024-04-15'
    }))
  },
  {
    id: 'm3',
    title: 'Spy x Family',
    author: 'Tatsuya Endo',
    cover: 'https://placehold.co/300x450/2f3b3b/FFF?text=Spy+x+Family',
    banner: 'https://placehold.co/1200x400/3f4b4b/FFF?text=Spy+x+Family+Banner',
    synopsis: 'A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own.',
    rating: 4.7,
    views: '5.1M',
    status: 'Ongoing',
    updatedAt: '2024-05-18',
    genres: ['Comedy', 'Action', 'Slice of Life'],
    readers: 1250000,
    followers: 478000,
    chapters: Array.from({ length: 98 }, (_, i) => ({
      id: `c${98 - i}`,
      number: 98 - i,
      title: `Mission ${98 - i}`,
      date: '2024-05-18'
    }))
  },
  {
    id: 'm4',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    cover: 'https://placehold.co/300x450/800000/FFF?text=One+Piece',
    banner: 'https://placehold.co/1200x400/900000/FFF?text=One+Piece+Banner',
    synopsis: 'Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates.',
    rating: 5.0,
    views: '45.3M',
    status: 'Ongoing',
    updatedAt: '2024-05-21',
    genres: ['Adventure', 'Action', 'Comedy'],
    readers: 8900000,
    followers: 3200000,
    chapters: Array.from({ length: 1115 }, (_, i) => ({
      id: `c${1115 - i}`,
      number: 1115 - i,
      title: `Chapter ${1115 - i}`,
      date: '2024-05-21'
    }))
  },
  {
    id: 'm5',
    title: 'Jujutsu Kaisen',
    author: 'Gege Akutami',
    cover: 'https://placehold.co/300x450/451a03/FFF?text=JJK',
    banner: 'https://placehold.co/1200x400/451a03/FFF?text=JJK+Banner',
    synopsis: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.',
    rating: 4.8,
    views: '22M',
    status: 'Completed',
    updatedAt: '2024-05-19',
    genres: ['Action', 'Supernatural', 'School'],
    readers: 4500000,
    followers: 1650000,
    chapters: Array.from({ length: 240 }, (_, i) => ({
      id: `c${240 - i}`,
      number: 240 - i,
      title: `Chapter ${240 - i}`,
      date: '2024-05-19'
    }))
  }
];

// Helper to create slug
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Export with slugs added
export const MOCK_MANGA: Manga[] = BASE_MOCK_MANGA.map(manga => ({
  ...manga,
  slug: toSlug(manga.title),
  chapters: manga.chapters.map(ch => ({
    ...ch,
    slug: `chapter-${ch.number}`,
  })),
}));
