/**
 * VEDORA Centralized Design Token & Theme System
 * Strict 3-palette architecture with Light, Dark, and System appearance modes.
 */

export type ThemeId = 'forest' | 'navy' | 'cherry';
export type AppearanceMode = 'light' | 'dark' | 'system';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  subtitle: string;
  shortSubtitle: string;
  brandPrimary: string;
  secondary: string;
  mutedAccent: string;
  lightBackground: string;
  lightCard: string;
  lightCardBorder: string;
  darkBackground: string;
  darkCard: string;
  darkCardBorder: string;
  darkText: string;
  darkTextMuted: string;
  // Dynamic semantic tokens
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryButton: string;
  primaryButtonHover: string;
  primaryButtonText: string;
  accent: string;
  accentBgSubtle: string;
  accentBorder: string;
  accentText: string;
  inputBg: string;
  navBg: string;
  navBorder: string;
}

export const THEME_CONFIGS: Record<ThemeId, Omit<ThemePalette, 'bg' | 'cardBg' | 'cardBorder' | 'textPrimary' | 'textSecondary' | 'textMuted' | 'primaryButton' | 'primaryButtonHover' | 'primaryButtonText' | 'accent' | 'accentBgSubtle' | 'accentBorder' | 'accentText' | 'inputBg' | 'navBg' | 'navBorder'>> = {
  forest: {
    id: 'forest',
    name: 'Dark Forest Green',
    subtitle: 'Calm, focused, natural, and distinctive',
    shortSubtitle: 'Calm, focused, natural',
    brandPrimary: '#132A13',
    secondary: '#2E5A46',
    mutedAccent: '#A7C1A9',
    lightBackground: '#FAF4D3',
    lightCard: '#F7F2E2',
    lightCardBorder: '#E8DEC5',
    darkBackground: '#1A1A1A',
    darkCard: '#242721',
    darkCardBorder: '#32382F',
    darkText: '#F2F0E8',
    darkTextMuted: '#A8A69E',
  },
  navy: {
    id: 'navy',
    name: 'Navy Blue',
    subtitle: 'Modern, clean, professional, and understated',
    shortSubtitle: 'Modern, clean, professional',
    brandPrimary: '#212842',
    secondary: '#3B5B93',
    mutedAccent: '#8CA8D6',
    lightBackground: '#F0E7D5',
    lightCard: '#EBE1CF',
    lightCardBorder: '#DED4C0',
    darkBackground: '#1A1A1A',
    darkCard: '#20232B',
    darkCardBorder: '#2D3445',
    darkText: '#F2F0E8',
    darkTextMuted: '#A2A6B2',
  },
  cherry: {
    id: 'cherry',
    name: 'Black Cherry',
    subtitle: 'Elegant, warm, literary, and distinctive',
    shortSubtitle: 'Elegant, warm, unique',
    brandPrimary: '#5B100D',
    secondary: '#8E3E3E',
    mutedAccent: '#E6C6C6',
    lightBackground: '#FFEFDE',
    lightCard: '#F7E5DA',
    lightCardBorder: '#ECCEC0',
    darkBackground: '#1A1A1A',
    darkCard: '#282021',
    darkCardBorder: '#3E2B2D',
    darkText: '#F2F0E8',
    darkTextMuted: '#B0A0A0',
  },
};

export function getResolvedTheme(themeId: ThemeId, isDark: boolean): ThemePalette {
  const base = THEME_CONFIGS[themeId] || THEME_CONFIGS.forest;

  if (isDark) {
    return {
      ...base,
      bg: base.darkBackground, // #1A1A1A
      cardBg: base.darkCard,
      cardBorder: base.darkCardBorder,
      textPrimary: base.darkText, // #F2F0E8
      textSecondary: base.darkTextMuted,
      textMuted: '#787670',
      primaryButton: base.secondary,
      primaryButtonHover: base.brandPrimary,
      primaryButtonText: '#FFFFFF',
      accent: base.mutedAccent,
      accentBgSubtle: `${base.secondary}33`,
      accentBorder: base.secondary,
      accentText: base.mutedAccent,
      inputBg: '#252525',
      navBg: `${base.darkCard}F2`,
      navBorder: base.darkCardBorder,
    };
  }

  // Light Mode
  return {
    ...base,
    bg: base.lightBackground,
    cardBg: base.lightCard,
    cardBorder: base.lightCardBorder,
    textPrimary: '#1F1D1A',
    textSecondary: '#666157',
    textMuted: '#8F8A7E',
    primaryButton: base.brandPrimary,
    primaryButtonHover: base.secondary,
    primaryButtonText: '#FFFFFF',
    accent: base.brandPrimary,
    accentBgSubtle: `${base.brandPrimary}14`,
    accentBorder: base.brandPrimary,
    accentText: base.brandPrimary,
    inputBg: `${base.lightCardBorder}80`,
    navBg: `${base.lightBackground}F2`,
    navBorder: base.lightCardBorder,
  };
}

export const THEME_STORAGE_KEY = 'vedora_theme_id';
export const APPEARANCE_STORAGE_KEY = 'vedora_appearance_mode';
