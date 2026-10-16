import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ThemeId,
  AppearanceMode,
  ThemePalette,
  getResolvedTheme,
  THEME_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
} from './themeSystem';

interface ThemeContextType {
  themeId: ThemeId;
  appearanceMode: AppearanceMode;
  isDark: boolean;
  theme: ThemePalette;
  setThemeId: (id: ThemeId) => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
      if (saved && (saved === 'forest' || saved === 'navy' || saved === 'cherry')) {
        return saved;
      }
    } catch {}
    return 'forest'; // Default on first launch
  });

  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(() => {
    try {
      const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY) as AppearanceMode;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved;
      }
    } catch {}
    return 'light'; // Default is light warm beige
  });

  // Track system preference
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const isDark = useMemo(() => {
    if (appearanceMode === 'dark') return true;
    if (appearanceMode === 'light') return false;
    return systemIsDark;
  }, [appearanceMode, systemIsDark]);

  const theme = useMemo(() => {
    return getResolvedTheme(themeId, isDark);
  }, [themeId, isDark]);

  const setThemeId = (newId: ThemeId) => {
    setThemeIdState(newId);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newId);
    } catch {}
  };

  const setAppearanceMode = (newMode: AppearanceMode) => {
    setAppearanceModeState(newMode);
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, newMode);
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        appearanceMode,
        isDark,
        theme,
        setThemeId,
        setAppearanceMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
