"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface StarRatingProps {
  rating: number;           // Current average rating (0-5)
  userRating?: number;      // User's rating if they've rated (0-5)
  onRate?: (rating: number) => void;  // Callback when user rates
  readonly?: boolean;       // If true, user can't rate
  interactive?: boolean;    // Alias for !readonly
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;      // Show numeric value
  totalRatings?: number;    // Total number of ratings
  className?: string;       // Additional classes
}

export function StarRating({ 
  rating, 
  userRating = 0, 
  onRate, 
  readonly = false,
  interactive = false,
  size = 'md',
  showValue = true,
  totalRatings,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  // interactive overrides readonly
  const isReadOnly = readonly && !interactive;
  const canInteract = interactive || (!readonly && onRate);
  
  const sizeClasses = {
    sm: 16,
    md: 24,
    lg: 32,
  };
  
  const iconSize = sizeClasses[size];
  const displayRating = hoverRating || userRating || rating;

  const handleClick = (star: number) => {
    if (canInteract && onRate) {
      onRate(star);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className="flex gap-0.5"
        onMouseLeave={() => canInteract && setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalf = !isFilled && star - 0.5 <= displayRating;
          
          return (
            <button
              key={star}
              type="button"
              disabled={!canInteract}
              onClick={() => handleClick(star)}
              onMouseEnter={() => canInteract && setHoverRating(star)}
              className={cn(
                "transition-all duration-150",
                canInteract ? "cursor-pointer hover:scale-110" : "cursor-default",
                isFilled || isHalf ? "text-kiniro-400" : "text-sumi-600"
              )}
            >
              <Star 
                size={iconSize} 
                fill={isFilled ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-sumi-50">
            {displayRating.toFixed(1)}
          </span>
          {totalRatings !== undefined && (
            <span className="text-xs text-sumi-500">
              ({totalRatings.toLocaleString()} ratings)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  mangaTitle: string;
  currentRating?: number;
}

export function RatingModal({ isOpen, onClose, onSubmit, mangaTitle, currentRating = 0 }: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState(currentRating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSubmit(selectedRating);
    setIsSubmitting(false);
    onClose();
  };

  const ratingLabels: Record<number, { en: string; jp: string }> = {
    1: { en: 'Poor', jp: '悪い' },
    2: { en: 'Fair', jp: 'まあまあ' },
    3: { en: 'Good', jp: '良い' },
    4: { en: 'Great', jp: '素晴らしい' },
    5: { en: 'Masterpiece!', jp: '傑作!' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-sumi-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative jp-card rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
        <div className="absolute inset-0 pattern-asanoha opacity-20 rounded-2xl" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-center mb-1 text-sumi-50">
            Rate this Manga
          </h3>
          <p className="text-center text-kiniro-400/70 text-xs mb-4">この漫画を評価する</p>
          <p className="text-center text-sumi-400 mb-6 text-sm">
            {mangaTitle}
          </p>
          
          {/* Stars */}
          <div className="flex justify-center mb-4">
            <StarRating
              rating={0}
              userRating={selectedRating}
              onRate={setSelectedRating}
              size="lg"
              showValue={false}
              interactive
            />
          </div>
          
          {/* Rating Label */}
          <div className={cn(
            "text-center mb-6 h-12 transition-all",
            selectedRating > 0 ? "text-kiniro-400" : "text-sumi-500"
          )}>
            {selectedRating > 0 ? (
              <>
                <p className="font-bold text-lg">{ratingLabels[selectedRating].en}</p>
                <p className="text-xs text-kiniro-400/70">{ratingLabels[selectedRating].jp}</p>
              </>
            ) : (
              <p className="text-sm pt-2">Tap a star to rate</p>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium bg-sumi-800/50 border border-sumi-700/50 text-sumi-300 hover:bg-sumi-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedRating === 0 || isSubmitting}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold transition-all",
                selectedRating > 0
                  ? "btn-jp text-white"
                  : "bg-sumi-800/50 text-sumi-600 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
