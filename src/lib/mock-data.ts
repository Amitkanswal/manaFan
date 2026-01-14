import { Manga } from "@/types";

export const MOCK_DB: { manga: Manga[] } = {
  manga: [
    {
      id: 'm1',
      title: 'Solo Leveling: Arise',
      author: 'Chugong',
      cover: 'https://placehold.co/300x450/1a1a1a/FFF?text=Solo+Leveling',
      banner: 'https://placehold.co/1200x400/2a2a2a/FFF?text=Solo+Leveling+Banner',
      synopsis: 'In a world where hunters must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. Watch his journey from the weakest to the strongest hunter.',
      rating: 4.9,
      views: '12.5M',
      status: 'Ongoing',
      updatedAt: '2024-05-20',
      genres: ['Action', 'Fantasy', 'Adventure'],
      chapters: Array.from({ length: 150 }, (_, i) => ({ id: `c${150 - i}`, number: 150 - i, title: `Chapter ${150 - i}`, date: '2024-05-20' }))
    },
    {
      id: 'm2',
      title: 'The Beginning After The End',
      author: 'TurtleMe',
      cover: 'https://placehold.co/300x450/3b2f2f/FFF?text=TBATE',
      banner: 'https://placehold.co/1200x400/4b3f3f/FFF?text=TBATE+Banner',
      synopsis: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Reincarnated into a new world filled with magic and monsters, the king has a second chance to relive his life.',
      rating: 4.8,
      views: '8.2M',
      status: 'Hiatus',
      updatedAt: '2024-04-15',
      genres: ['Isekai', 'Magic', 'Reincarnation'],
      chapters: Array.from({ length: 175 }, (_, i) => ({ id: `c${175 - i}`, number: 175 - i, title: `Chapter ${175 - i}`, date: '2024-04-15' }))
    },
    {
      id: 'm3',
      title: 'Spy x Family',
      author: 'Tatsuya Endo',
      cover: 'https://placehold.co/300x450/2f3b3b/FFF?text=Spy+x+Family',
      banner: 'https://placehold.co/1200x400/3f4b4b/FFF?text=Spy+x+Family+Banner',
      synopsis: 'A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and all three must strive to keep together.',
      rating: 4.7,
      views: '5.1M',
      status: 'Ongoing',
      updatedAt: '2024-05-18',
      genres: ['Comedy', 'Action', 'Slice of Life'],
      chapters: Array.from({ length: 98 }, (_, i) => ({ id: `c${98 - i}`, number: 98 - i, title: `Mission ${98 - i}`, date: '2024-05-18' }))
    },
    {
      id: 'm4',
      title: 'One Piece',
      author: 'Eiichiro Oda',
      cover: 'https://placehold.co/300x450/800000/FFF?text=One+Piece',
      banner: 'https://placehold.co/1200x400/900000/FFF?text=One+Piece+Banner',
      synopsis: 'Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates. With a course charted for the treacherous waters of the Grand Line and beyond, this is one captain who will never drop anchor until he has claimed the greatest treasure on Earth.',
      rating: 5.0,
      views: '45.3M',
      status: 'Ongoing',
      updatedAt: '2024-05-21',
      genres: ['Adventure', 'Action', 'Comedy'],
      chapters: Array.from({ length: 1115 }, (_, i) => ({ id: `c${1115 - i}`, number: 1115 - i, title: `Chapter ${1115 - i}`, date: '2024-05-21' }))
    },
    {
      id: 'm5',
      title: 'Naruto',
      author: 'Masashi Kishimoto',
      cover: 'https://placehold.co/300x450/ea580c/FFF?text=Naruto',
      banner: 'https://placehold.co/1200x400/ea580c/FFF?text=Naruto+Banner',
      synopsis: 'Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition and dreams of becoming the Hokage, the village\'s leader and strongest ninja.',
      rating: 4.6,
      views: '30M',
      status: 'Completed',
      updatedAt: '2014-11-10',
      genres: ['Action', 'Adventure', 'Fantasy'],
      chapters: Array.from({ length: 700 }, (_, i) => ({ id: `c${700 - i}`, number: 700 - i, title: `Chapter ${700 - i}`, date: '2014-11-10' }))
    },
    {
      id: 'm6',
      title: 'Demon Slayer',
      author: 'Koyoharu Gotouge',
      cover: 'https://placehold.co/300x450/1e293b/FFF?text=Demon+Slayer',
      banner: 'https://placehold.co/1200x400/1e293b/FFF?text=Demon+Slayer+Banner',
      synopsis: 'Tanjiro Kamado sets out to become a demon slayer to avenge his family and cure his sister.',
      rating: 4.8,
      views: '18M',
      status: 'Completed',
      updatedAt: '2020-05-18',
      genres: ['Action', 'Historical', 'Supernatural'],
      chapters: Array.from({ length: 205 }, (_, i) => ({ id: `c${205 - i}`, number: 205 - i, title: `Chapter ${205 - i}`, date: '2020-05-18' }))
    },
    {
      id: 'm7',
      title: 'Chainsaw Man',
      author: 'Tatsuki Fujimoto',
      cover: 'https://placehold.co/300x450/991b1b/FFF?text=CSM',
      banner: 'https://placehold.co/1200x400/991b1b/FFF?text=CSM+Banner',
      synopsis: 'Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes.',
      rating: 4.9,
      views: '14M',
      status: 'Ongoing',
      updatedAt: '2024-05-15',
      genres: ['Action', 'Horror', 'Dark Fantasy'],
      chapters: Array.from({ length: 150 }, (_, i) => ({ id: `c${150 - i}`, number: 150 - i, title: `Chapter ${150 - i}`, date: '2024-05-15' }))
    },
    {
      id: 'm8',
      title: 'Jujutsu Kaisen',
      author: 'Gege Akutami',
      cover: 'https://placehold.co/300x450/451a03/FFF?text=JJK',
      banner: 'https://placehold.co/1200x400/451a03/FFF?text=JJK+Banner',
      synopsis: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.',
      rating: 4.8,
      views: '22M',
      status: 'Ongoing',
      updatedAt: '2024-05-19',
      genres: ['Action', 'Supernatural', 'School'],
      chapters: Array.from({ length: 240 }, (_, i) => ({ id: `c${240 - i}`, number: 240 - i, title: `Chapter ${240 - i}`, date: '2024-05-19' }))
    }
  ]
};

