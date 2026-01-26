"use client";

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { UserLibraryProvider } from './user-library-provider';
import { AuthProvider } from './auth-provider';
import { BackendLibraryProvider } from './backend-library-provider';
import { PersonalizeProvider } from './personalize-provider';
import { ErrorBoundary } from '@/shared/components/error-boundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PersonalizeProvider>
            <BackendLibraryProvider>
              <UserLibraryProvider>
                {children}
              </UserLibraryProvider>
            </BackendLibraryProvider>
          </PersonalizeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export { useTheme } from './theme-provider';
export { 
  useUserLibrary, 
  useFollow, 
  useBookmark, 
  useMangaRating,
  type ReadingProgress,
  type FollowedManga,
  type BookmarkedManga,
  type ReadingHistoryItem,
  type UserRating,
} from './user-library-provider';

// Auth exports
export { useAuth, useAuthUser, useRequireAuth } from './auth-provider';

// Backend library exports
export {
  useBackendLibrary,
  useBookmarks,
  useRatings,
  useSubscriptions,
  useReadingProgress,
} from './backend-library-provider';

// Personalize exports
export {
  usePersonalize,
  usePersonalizedVariant,
  useTrackMangaRead,
  useGenrePreferences,
  useGenreBasedVariant,
} from './personalize-provider';
