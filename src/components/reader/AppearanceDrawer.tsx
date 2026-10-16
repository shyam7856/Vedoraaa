import React from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Moon,
  Coffee,
  ScrollText,
  FileText,
  Sliders,
  Type,
  Info,
  Minus,
  Plus,
  Eye,
  Smartphone,
} from 'lucide-react';
import { ReaderTheme, ReaderViewMode, ReaderFont, READER_FONTS } from '../../types';

interface AppearanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ReaderTheme;
  onChangeTheme: (theme: ReaderTheme) => void;
  zoomScale: number;
  onChangeZoom: (newZoom: number) => void;
  viewMode: ReaderViewMode;
  onChangeViewMode: (mode: ReaderViewMode) => void;
  fontFamily: ReaderFont;
  onChangeFont: (font: ReaderFont) => void;
  brightness?: number;
  onChangeBrightness?: (val: number) => void;
  fontSizePercent?: number;
  onChangeFontSize?: (pct: number) => void;
  showPageNumbers?: boolean;
  onTogglePageNumbers?: () => void;
  keepScreenOn?: boolean;
  onToggleKeepScreenOn?: () => void;
}

export const AppearanceDrawer: React.FC<AppearanceDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  zoomScale,
  onChangeZoom,
  viewMode,
  onChangeViewMode,
  fontFamily,
  onChangeFont,
  brightness = 100,
  onChangeBrightness,
  fontSizePercent = 100,
  onChangeFontSize,
  showPageNumbers = true,
  onTogglePageNumbers,
  keepScreenOn = false,
  onToggleKeepScreenOn,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const drawerBg = isDark
    ? 'bg-[#1C1C1A] text-[#EDE6D8]'
    : isSepia
    ? 'bg-[#F4EDE4] text-[#3A3026]'
    : 'bg-[#F6F1E8] text-[#302C26]';

  const cardBg = isDark
    ? 'bg-[#252523] border-zinc-800'
    : isSepia
    ? 'bg-[#FAF4E8] border-[#E2D8C7]'
    : 'bg-[#FBF8F2] border-[#E4DCCE]';

  // Elegant outlined selection styling (subtle background, clean green/teal outline, strong contrast)
  const selectedStyle = isDark
    ? 'border-2 border-teal-400 bg-teal-500/15 text-teal-200 shadow-xs'
    : 'border-2 border-[#154D43] bg-[#154D43]/10 text-[#154D43] shadow-xs';

  const unselectedStyle = isDark
    ? 'border border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800/80'
    : 'border border-[#E4DCCE] bg-white/70 text-stone-700 hover:bg-white';

  const zoomPercent = Math.round(zoomScale * 100);
  const currentFontName = READER_FONTS.find((f) => f.id === fontFamily)?.name || 'Plus Jakarta Sans';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${drawerBg} rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl border-t border-[#E4DCCE]/80 dark:border-zinc-800 animate-in slide-in-from-bottom duration-250`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle */}
        <div className="w-12 h-1 bg-[#777064]/30 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E4DCCE]/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
            <h3 className="font-serif-display font-bold text-base tracking-tight">
              Reading Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#777064] dark:text-zinc-400"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
          {/* 1. Theme Palette with elegant outlined selection */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <span className="text-[11px] font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
              Theme Palette
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'light',
                  label: 'Warm Ivory',
                  icon: Sun,
                  bg: 'bg-[#FBF8F1]',
                  text: 'text-[#302C26]',
                },
                {
                  id: 'sepia',
                  label: 'Sepia Paper',
                  icon: Coffee,
                  bg: 'bg-[#FAF4E8]',
                  text: 'text-[#3A3026]',
                },
                {
                  id: 'dark',
                  label: 'Dark Literary',
                  icon: Moon,
                  bg: 'bg-[#1F1F1D]',
                  text: 'text-[#E8E0D3]',
                },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeTheme(t.id as ReaderTheme)}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${t.bg} ${t.text} ${
                      isSelected
                        ? selectedStyle
                        : unselectedStyle
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
                    <span className="text-[11px] font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Reading Layout Mode with elegant outlined selection */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <span className="text-[11px] font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
              Reading Layout
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'continuous',
                  label: 'Continuous Scroll',
                  sub: 'Vertical Flow',
                  icon: ScrollText,
                },
                {
                  id: 'single',
                  label: 'Single Page',
                  sub: 'Focused Page',
                  icon: FileText,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = viewMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChangeViewMode(m.id as ReaderViewMode)}
                    className={`p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                      isSelected ? selectedStyle : unselectedStyle
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-[#154D43] dark:text-teal-400" />
                    <div>
                      <div className="text-xs font-bold leading-tight">{m.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{m.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Font (Renamed from Reading Typography) */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>Font</span>
              </span>
              <span className="text-[11px] font-bold text-[#154D43] dark:text-teal-400">
                {currentFontName}
              </span>
            </div>

            {/* Font Choices */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {READER_FONTS.map((f) => {
                const isSelected = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChangeFont(f.id)}
                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected ? selectedStyle : unselectedStyle
                    }`}
                  >
                    <div className={`text-xs font-bold leading-tight ${f.fontClass}`}>
                      {f.name}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 truncate">
                      {f.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Font Size Adjustment for reflowable annotations & reader text */}
            {onChangeFontSize && (
              <div className="mt-3 pt-3 border-t border-[#E4DCCE]/60 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                  Text & Note Size
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeFontSize(Math.max(80, fontSizePercent - 10))}
                    className="w-7 h-7 rounded-lg border border-[#E4DCCE] dark:border-zinc-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                    title="Decrease font size"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold tabular-nums w-10 text-center text-[#154D43] dark:text-teal-400">
                    {fontSizePercent}%
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeFontSize(Math.min(150, fontSizePercent + 10))}
                    className="w-7 h-7 rounded-lg border border-[#E4DCCE] dark:border-zinc-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                    title="Increase font size"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Authentic PDF typography notice */}
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-stone-600 dark:text-zinc-300 flex items-start gap-2 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Applies to reader interface, notes, annotations, and text search layer.
                <strong className="font-semibold block mt-0.5">Note:</strong> Original PDF pages retain their author-embedded vector typography.
              </span>
            </div>
          </div>

          {/* 4. Brightness & Screen Controls */}
          {onChangeBrightness && (
            <div className={`p-4 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Reader Brightness</span>
                </span>
                <span className="text-xs font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                  {brightness}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Sun className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={brightness}
                  onChange={(e) => onChangeBrightness(parseInt(e.target.value, 10))}
                  className="w-full accent-[#154D43] dark:accent-teal-400 h-1.5 bg-[#E4DCCE] dark:bg-zinc-700 rounded-lg cursor-pointer"
                />
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              </div>

              {/* Toggles: Keep Screen On & Page Numbers */}
              <div className="mt-3 pt-3 border-t border-[#E4DCCE]/60 dark:border-zinc-800 grid grid-cols-2 gap-2">
                {onToggleKeepScreenOn && (
                  <button
                    type="button"
                    onClick={onToggleKeepScreenOn}
                    className={`p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      keepScreenOn ? selectedStyle : unselectedStyle
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Smartphone className="w-3.5 h-3.5 text-[#154D43] dark:text-teal-400" />
                      <span>Keep Screen On</span>
                    </span>
                    <span className="text-[10px] font-bold">
                      {keepScreenOn ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
                {onTogglePageNumbers && (
                  <button
                    type="button"
                    onClick={onTogglePageNumbers}
                    className={`p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      showPageNumbers ? selectedStyle : unselectedStyle
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Eye className="w-3.5 h-3.5 text-[#154D43] dark:text-teal-400" />
                      <span>Page Indicator</span>
                    </span>
                    <span className="text-[10px] font-bold">
                      {showPageNumbers ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. PDF Page Zoom */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider">
                PDF Page Zoom
              </span>
              <span className="text-xs font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                {zoomPercent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeZoom(Math.max(0.6, parseFloat((zoomScale - 0.15).toFixed(2))))}
                className="flex-1 py-2 rounded-xl border border-[#E4DCCE] dark:border-zinc-700 flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Zoom Out</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeZoom(1.0)}
                className="py-2 px-3 rounded-xl border border-[#E4DCCE] dark:border-zinc-700 flex items-center justify-center gap-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                title="Fit to Width (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fit Width</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeZoom(Math.min(3.0, parseFloat((zoomScale + 0.15).toFixed(2))))}
                className="flex-1 py-2 rounded-xl border border-[#E4DCCE] dark:border-zinc-700 flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom In</span>
              </button>
            </div>
            {/* Quick Zoom Presets */}
            <div className="flex items-center justify-between gap-1.5 mt-2.5">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((scale) => {
                const pct = Math.round(scale * 100);
                const isCur = Math.abs(zoomScale - scale) < 0.05;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChangeZoom(scale)}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-lg tabular-nums cursor-pointer transition-colors ${
                      isCur
                        ? 'bg-[#154D43] text-white font-bold'
                        : isDark
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
