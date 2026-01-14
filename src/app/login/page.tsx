"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/core/providers';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

type AuthMode = 'login' | 'register' | 'magic-link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    login, 
    register, 
    requestMagicLink, 
    isAuthenticated, 
    isLoading: authLoading,
    getRedirectUrl,
    clearRedirectUrl,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get redirect URL for displaying context
  const redirectUrl = getRedirectUrl();
  const redirectContext = redirectUrl ? decodeURIComponent(redirectUrl.split('/')[1] || '') : null;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const url = getRedirectUrl();
      clearRedirectUrl();
      router.push(url || '/');
    }
  }, [isAuthenticated, router, getRedirectUrl, clearRedirectUrl]);

  // Handle error from URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'invalid_link') {
      setError('Invalid or expired magic link. Please request a new one.');
    } else if (errorParam === 'expired_link') {
      setError('This magic link has expired. Please request a new one.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'magic-link') {
        const result = await requestMagicLink(email);
        if (result.success) {
          setSuccess('Magic link sent! Check your email inbox.');
        } else {
          setError(result.error || 'Failed to send magic link');
        }
      } else if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          // Redirect is handled by the useEffect above when isAuthenticated changes
        } else {
          setError(result.error || 'Login failed');
        }
      } else if (mode === 'register') {
        const result = await register(email, password, name);
        if (result.success) {
          // Redirect is handled by the useEffect above when isAuthenticated changes
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sumi-950">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-vermillion-500" />
          <div className="absolute inset-0 blur-xl bg-vermillion-500/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sumi-950 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pattern-seigaiha opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-vermillion-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-kiniro-400/5 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-sakura-500/5 rounded-full blur-3xl" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 text-6xl opacity-10 animate-float">桜</div>
      <div className="absolute bottom-32 right-20 text-5xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>漫</div>
      <div className="absolute top-1/2 left-10 text-4xl opacity-10 animate-float" style={{ animationDelay: '4s' }}>画</div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <div className="w-14 h-14 bg-gradient-to-br from-vermillion-500 to-vermillion-700 rounded-xl flex items-center justify-center shadow-xl shadow-vermillion-500/30 group-hover:scale-105 transition-transform">
            <span className="text-white text-2xl font-black">漫</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-sumi-50">
              Manga<span className="text-gradient-vermillion">Fan</span>
            </span>
            <span className="text-[10px] text-kiniro-400/70 tracking-[0.25em]">マンガファン</span>
          </div>
        </Link>

        {/* Card */}
        <div className="jp-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-sumi-50 mb-2">
              {mode === 'login' ? 'お帰りなさい' : mode === 'register' ? 'アカウント作成' : 'ログイン'}
            </h1>
            <p className="text-sumi-400 text-sm">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </p>
            <p className="text-sumi-500 text-xs mt-2">
              {mode === 'magic-link' 
                ? "We'll send you a magic link to sign in instantly"
                : mode === 'register'
                ? 'Join thousands of manga readers'
                : 'Enter your credentials to continue'}
            </p>
            {/* Show context if redirected from manga page */}
            {redirectContext && (
              <div className="mt-4 p-3 bg-kiniro-400/10 border border-kiniro-400/20 rounded-xl">
                <p className="text-kiniro-400 text-sm">
                  🔔 Sign in to follow <span className="font-semibold">{redirectContext.replace(/-/g, ' ')}</span>
                </p>
              </div>
            )}
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-1 mb-8 p-1 bg-sumi-800/50 rounded-xl border border-sumi-700/30">
            <button
              onClick={() => { setMode('magic-link'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'magic-link'
                  ? 'bg-gradient-to-r from-vermillion-500 to-vermillion-600 text-white shadow-lg shadow-vermillion-500/30'
                  : 'text-sumi-400 hover:text-sumi-200'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1.5" />
              Magic
            </button>
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-vermillion-500 to-vermillion-600 text-white shadow-lg shadow-vermillion-500/30'
                  : 'text-sumi-400 hover:text-sumi-200'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-vermillion-500 to-vermillion-600 text-white shadow-lg shadow-vermillion-500/30'
                  : 'text-sumi-400 hover:text-sumi-200'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-sumi-300 mb-2">
                  Name <span className="text-sumi-600">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sumi-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-12 pr-4 py-3.5 bg-sumi-800/50 border border-sumi-700/50 rounded-xl text-sumi-100 placeholder:text-sumi-600 focus:outline-none focus:ring-2 focus:ring-vermillion-500/50 focus:border-vermillion-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-sumi-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sumi-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-sumi-800/50 border border-sumi-700/50 rounded-xl text-sumi-100 placeholder:text-sumi-600 focus:outline-none focus:ring-2 focus:ring-vermillion-500/50 focus:border-vermillion-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password field (login/register) */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="block text-sm font-medium text-sumi-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sumi-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    className="w-full pl-12 pr-4 py-3.5 bg-sumi-800/50 border border-sumi-700/50 rounded-xl text-sumi-100 placeholder:text-sumi-600 focus:outline-none focus:ring-2 focus:ring-vermillion-500/50 focus:border-vermillion-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-4 bg-vermillion-500/10 border border-vermillion-500/20 rounded-xl text-vermillion-400 text-sm flex items-center gap-2">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-4 bg-matcha-500/10 border border-matcha-500/20 rounded-xl text-matcha-400 text-sm flex items-center gap-2">
                <span className="text-lg">✨</span> {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 btn-jp text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'magic-link' ? 'Send Magic Link' : mode === 'register' ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Guest info */}
          <div className="mt-8 pt-6 border-t border-sumi-800 text-center">
            <p className="text-sumi-400 text-sm">
              <span className="text-sumi-600">Don't want to sign up?</span>{' '}
              <Link href="/" className="text-vermillion-400 hover:text-vermillion-300 transition-colors font-medium">
                Continue as guest →
              </Link>
            </p>
            <p className="text-sumi-600 text-xs mt-2">
              Guests can read manga freely. Sign in to save bookmarks and get notifications.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-3 gap-6 text-center">
          <div className="group">
            <div className="w-12 h-12 bg-sumi-800/50 border border-sumi-700/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:border-vermillion-500/30 transition-colors">
              <span className="text-2xl">📖</span>
            </div>
            <p className="text-sumi-400 text-xs">Track Progress</p>
            <p className="text-sumi-600 text-[10px]">進捗追跡</p>
          </div>
          <div className="group">
            <div className="w-12 h-12 bg-sumi-800/50 border border-sumi-700/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:border-kiniro-400/30 transition-colors">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-sumi-400 text-xs">Get Notified</p>
            <p className="text-sumi-600 text-[10px]">通知を受け取る</p>
          </div>
          <div className="group">
            <div className="w-12 h-12 bg-sumi-800/50 border border-sumi-700/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:border-sakura-400/30 transition-colors">
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-sumi-400 text-xs">Rate & Review</p>
            <p className="text-sumi-600 text-[10px]">評価する</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-sumi-950">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-vermillion-500" />
          <div className="absolute inset-0 blur-xl bg-vermillion-500/30 animate-pulse" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
