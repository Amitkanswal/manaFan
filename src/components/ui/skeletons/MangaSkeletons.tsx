import React from 'react';

export const MangaCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
    </div>
  );
};

export const SectionRowSkeleton: React.FC = () => {
  return (
    <div className="mb-10">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-4" />
      <div className="flex gap-4 overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[150px] md:min-w-[180px] lg:min-w-[200px]">
            <MangaCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

