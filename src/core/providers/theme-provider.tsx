"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'blue';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mangafan-theme', newTheme);
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mangafan-theme') as Theme | null;
    if (saved && ['light', 'dark', 'blue'].includes(saved)) {
      setThemeState(saved);
    }
  }, []);

  // Generate theme classes
  const themeClasses = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'dark bg-gray-900 text-white',
    blue: 'dark bg-[#0f172a] text-white',
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
