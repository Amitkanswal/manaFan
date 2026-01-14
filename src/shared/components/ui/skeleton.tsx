import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-sumi-800 via-sumi-700 to-sumi-800 rounded-xl',
        className
      )}
    />
  );
}
