import { Skeleton } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { Manga } from '../types';
import { MangaCard } from './manga-card';

interface MangaGridProps {
  items: Manga[];
  isLoading?: boolean;
  className?: string;
}

export function MangaGrid({ items, isLoading, className }: MangaGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6', className)}>
        {Array.from({ length: 10 }).map((_, i) => (
          <MangaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <p>No manga found</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6', className)}>
      {items.map(manga => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  );
}

function MangaCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[2/3] rounded-lg mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
