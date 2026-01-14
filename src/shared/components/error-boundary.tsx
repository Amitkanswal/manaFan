"use client";

import { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child components
 * Displays a user-friendly fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // In production, you could send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: { errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-sumi-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vermillion-500/10 border border-vermillion-500/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-vermillion-400" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-sumi-50 mb-2">
              Something went wrong
            </h1>
            <p className="text-sumi-400 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-sumi-900 rounded-lg text-left border border-sumi-800">
                <p className="text-xs text-vermillion-400 font-mono mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-sumi-500 overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-vermillion-500 hover:bg-vermillion-600 text-white font-semibold rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sumi-800 hover:bg-sumi-700 text-sumi-200 font-semibold rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>

            {/* Help text */}
            <p className="mt-6 text-xs text-sumi-600">
              If this problem persists, please refresh the page or clear your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for async/server component boundaries
 */
export function AsyncBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

