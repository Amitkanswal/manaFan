/**
 * Shared Types
 * Types used across multiple features
 */

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Common component props
export interface BaseProps {
  className?: string;
}

// Async state
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

