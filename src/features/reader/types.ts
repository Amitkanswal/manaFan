/**
 * Reader Feature Types
 */

export interface Page {
  id: number;
  url: string;
  number: number;
}

export type ReadingMode = 'webtoon' | 'page';

export interface ReaderSettings {
  mode: ReadingMode;
  autoScroll: boolean;
  scrollSpeed: number;
}

export const defaultReaderSettings: ReaderSettings = {
  mode: 'webtoon',
  autoScroll: false,
  scrollSpeed: 2,
};

