"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sun, Moon, Monitor, Bell, BellOff, Mail, Settings, LogOut, Loader2, Check, X, BookMarked, Star } from 'lucide-react';
import { Navbar } from '@/shared/components/navbar';
import { useTheme, Theme } from '@/core/providers/theme-provider';
import { useAuth, useBackendLibrary } from '@/core/providers';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { 
    isAuthenticated, 
    user, 
    isLoading: authLoading, 
    updateProfile, 
    logout 
  } = useAuth();
  const { 
    bookmarks, 
    subscriptions, 
    ratings,
    readingProgress,
    unsubscribe,
    isLoading: libraryLoading 
  } = useBackendLibrary();

  const [name, setName] = useState('');
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle unsubscribe from URL param
  useEffect(() => {
    const unsubscribeSlug = searchParams.get('unsubscribe');
    if (unsubscribeSlug && isAuthenticated) {
      const sub = Object.values(subscriptions).find(s => s.mangaSlug === unsubscribeSlug);
      if (sub) {
        handleUnsubscribe(sub.mangaUid, sub.mangaTitle);
      }
    }
  }, [searchParams, subscriptions, isAuthenticated]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmailUpdates(user.emailUpdatesOptIn);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const result = await updateProfile({ name, emailUpdatesOptIn: emailUpdates });

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save' });
    }

    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleUnsubscribe = async (mangaUid: string, mangaTitle: string) => {
    const success = await unsubscribe(mangaUid);
    if (success) {
      setSaveMessage({ type: 'success', text: `Unsubscribed from ${mangaTitle}` });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const themes: { value: Theme; label: string; icon: typeof Sun; description: string; jpLabel: string }[] = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Classic light mode', jpLabel: 'ライト' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes', jpLabel: 'ダーク' },
    { value: 'blue', label: 'Eye Care', icon: Monitor, description: 'Reduced blue light', jpLabel: 'ブルーライトカット' },
  ];

  const bookmarkCount = Object.keys(bookmarks).length;
  const subscriptionCount = Object.keys(subscriptions).length;
  const ratingCount = Object.keys(ratings).length;
  const progressCount = Object.keys(readingProgress).length;

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-vermillion-500" />
            <div className="absolute inset-0 blur-xl bg-vermillion-500/30 animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-vermillion-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-kiniro-400/5 rounded-full blur-3xl" />

        {/* Save Message Toast */}
        {saveMessage && (
          <div className={cn(
            "fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all backdrop-blur-sm",
            saveMessage.type === 'success' 
              ? 'bg-matcha-500/90 text-white' 
              : 'bg-vermillion-500/90 text-white'
          )}>
            {saveMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {saveMessage.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="jp-card rounded-2xl p-8 relative z-10">
          <div className="absolute inset-0 pattern-seigaiha opacity-20 rounded-2xl" />
          <div className="relative z-10">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-vermillion-400 to-kiniro-500 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-vermillion-500/30">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-sumi-50">{user.name || 'Manga Reader'}</h2>
                  <p className="text-sumi-400">{user.email}</p>
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-matcha-400 bg-matcha-500/10 border border-matcha-500/20 px-2 py-1 rounded-full mt-2">
                      <Check size={12} /> Email Verified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-4 py-2 text-sumi-400 hover:text-vermillion-400 hover:bg-vermillion-500/10 rounded-xl transition-colors"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-24 h-24 rounded-full bg-sumi-700 flex items-center justify-center text-4xl">
                  👤
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-sumi-50 mb-2">Guest User</h2>
                  <p className="text-sumi-400 mb-6">Sign in to save bookmarks and get notifications</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 btn-jp text-white rounded-xl font-medium"
                  >
                    <Mail size={18} />
                    Sign In
                  </Link>
                </div>
          </div>
            )}
          </div>
        </div>

        {/* Account Settings (Authenticated only) */}
        {isAuthenticated && user && (
          <div className="jp-card rounded-2xl p-6 relative z-10">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-sumi-50">
              <Settings size={20} className="text-kiniro-400" /> Account Settings
              <span className="text-xs text-kiniro-400/70 ml-2">設定</span>
            </h3>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-sumi-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full max-w-md px-4 py-3 bg-sumi-800/50 border border-sumi-700/50 rounded-xl text-sumi-100 placeholder:text-sumi-600 focus:ring-2 focus:ring-vermillion-500/50 focus:border-vermillion-500/50 focus:outline-none transition-all"
                />
              </div>

              {/* Email Notifications */}
              <div>
                <label className="block text-sm font-medium text-sumi-300 mb-2">
                  Email Notifications
                </label>
                <button
                  onClick={() => setEmailUpdates(!emailUpdates)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                    emailUpdates
                      ? "border-vermillion-500/50 bg-vermillion-500/10 text-vermillion-400"
                      : "border-sumi-700 text-sumi-400"
                  )}
                >
                  {emailUpdates ? <Bell size={20} /> : <BellOff size={20} />}
                  <div className="text-left">
                    <p className="font-medium">{emailUpdates ? 'Notifications Enabled' : 'Notifications Disabled'}</p>
                    <p className="text-xs opacity-70">
                      {emailUpdates 
                        ? 'You will receive emails when subscribed manga get new chapters' 
                        : 'Enable to get notified about new chapters'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 btn-jp text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Subscriptions (Authenticated only) */}
        {isAuthenticated && subscriptionCount > 0 && (
          <div className="jp-card rounded-2xl p-6 relative z-10">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-sumi-50">
              <Bell size={20} className="text-kiniro-400" /> Your Subscriptions
              <span className="text-xs text-kiniro-400/70 ml-2">購読</span>
            </h3>

            <div className="space-y-3">
              {Object.values(subscriptions).map((sub) => (
                <div
                  key={sub.mangaUid}
                  className="flex items-center justify-between p-4 bg-sumi-800/30 border border-sumi-700/50 rounded-xl"
                >
                  <Link
                    href={`/${sub.mangaSlug}`}
                    className="font-medium text-sumi-100 hover:text-vermillion-400 transition-colors"
                  >
                    {sub.mangaTitle}
                  </Link>
                  <button
                    onClick={() => handleUnsubscribe(sub.mangaUid, sub.mangaTitle)}
                    className="text-sm text-sumi-500 hover:text-vermillion-400 transition-colors"
                  >
                    Unsubscribe
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display Mode */}
        <div className="jp-card rounded-2xl p-6 relative z-10">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-sumi-50">
            <span className="text-kiniro-400">⚙️</span> Reader Preferences
            <span className="text-xs text-kiniro-400/70 ml-2">リーダー設定</span>
          </h3>

          <label className="block text-sm font-bold text-sumi-300 mb-4">
            Display Mode
          </label>
          
          <div className="grid grid-cols-3 gap-4">
            {themes.map(({ value, label, icon: Icon, description, jpLabel }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                  theme === value
                    ? 'border-vermillion-500 bg-vermillion-500/10 text-vermillion-400'
                    : 'border-sumi-700/50 text-sumi-400 hover:border-sumi-600'
                )}
              >
                <Icon size={24} />
                <span className="text-sm font-bold">{label}</span>
                <span className="text-[10px] text-kiniro-400/60">{jpLabel}</span>
                <span className="text-xs opacity-60 text-center">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="jp-card rounded-2xl p-6 relative z-10">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-sumi-50">
            <span className="text-kiniro-400">📊</span> Your Stats
            <span className="text-xs text-kiniro-400/70 ml-2">統計</span>
          </h3>
          
          {isAuthenticated && !libraryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-sumi-800/30 border border-sumi-700/50 rounded-xl">
                <BookMarked className="w-6 h-6 mx-auto mb-2 text-vermillion-400" />
                <p className="text-2xl font-black text-vermillion-400">{bookmarkCount}</p>
                <p className="text-sm text-sumi-500">Bookmarks</p>
                <p className="text-xs text-kiniro-400/50">ブックマーク</p>
              </div>
              <div className="p-4 bg-sumi-800/30 border border-sumi-700/50 rounded-xl">
                <Bell className="w-6 h-6 mx-auto mb-2 text-ai-400" />
                <p className="text-2xl font-black text-ai-400">{subscriptionCount}</p>
                <p className="text-sm text-sumi-500">Subscriptions</p>
                <p className="text-xs text-kiniro-400/50">購読</p>
              </div>
              <div className="p-4 bg-sumi-800/30 border border-sumi-700/50 rounded-xl">
                <Star className="w-6 h-6 mx-auto mb-2 text-kiniro-400" />
                <p className="text-2xl font-black text-kiniro-400">{ratingCount}</p>
                <p className="text-sm text-sumi-500">Ratings</p>
                <p className="text-xs text-kiniro-400/50">評価</p>
              </div>
              <div className="p-4 bg-sumi-800/30 border border-sumi-700/50 rounded-xl">
                <span className="text-2xl block mb-1">📖</span>
                <p className="text-2xl font-black text-matcha-400">{progressCount}</p>
                <p className="text-sm text-sumi-500">In Progress</p>
                <p className="text-xs text-kiniro-400/50">読書中</p>
            </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sumi-500">
              {libraryLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-vermillion-400" />
              ) : (
                <p>Sign in to track your reading stats</p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-vermillion-500" />
            <div className="absolute inset-0 blur-xl bg-vermillion-500/30 animate-pulse" />
          </div>
        </div>
      </>
    }>
      <ProfileContent />
    </Suspense>
  );
}
