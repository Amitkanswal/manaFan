import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

const variants = {
  primary: 'btn-jp text-white',
  secondary: 'bg-sumi-800 text-sumi-100 hover:bg-sumi-700 border border-sumi-700',
  ghost: 'hover:bg-sumi-800/50 text-sumi-300 hover:text-sumi-100',
  outline: 'border-2 border-sumi-700 hover:border-vermillion-500/50 hover:bg-vermillion-500/10 text-sumi-300 hover:text-vermillion-400',
  kiniro: 'btn-kiniro text-sumi-900',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion-500/50',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
