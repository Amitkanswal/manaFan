export interface Chapter {
  id: string;
  number: number;
  title: string;
  date: string;
}

export interface Manga {
  id: string;
  title: string;
  author: string;
  cover: string;
  banner: string;
  synopsis: string;
  rating: number;
  views: string;
  status: 'Ongoing' | 'Hiatus' | 'Completed';
  updatedAt: string;
  genres: string[];
  chapters: Chapter[];
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'blue';
  autoScroll: boolean;
  scrollSpeed: number;
}

export interface ReadingHistory {
  id: string;
  mangaTitle: string;
  mangaCover: string;
  chapterTitle: string;
  chapterId: string;
  chapterNumber: number;
  readAt: any; // Firestore Timestamp
}

export interface Bookmark {
  id: string;
  title: string;
  cover: string;
  addedAt: any; // Firestore Timestamp
  active: boolean;
  subscribed?: boolean;
}

