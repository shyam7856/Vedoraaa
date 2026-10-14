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
  BookOpen,
  Type,
  Info,
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
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  const drawerBg = isDark
    ? 'bg-[#1F1F1D] text-[#E8E0D3]'
    : isSepia
    ? 'bg-[#F4EDE4] text-[#3A3026]'
    : 'bg-[#F5F0E6] text-[#302C26]';
  const cardBg = isDark
    ? 'bg-[#27272A]/70 border-zinc-700/80'
    : isSepia
    ? 'bg-[#FAF4E8] border-[#E4DCCE]'
    : 'bg-[#FBF8F1] border-[#E4DCCE]';
  const activeRing = isDark
    ? 'ring-2 ring-teal-400 border-teal-400 font-bold'
    : 'ring-2 ring-[#154D43] border-[#154D43] font-bold';

  const zoomPercent = Math.round(zoomScale * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${drawerBg} rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-[#E4DCCE]/80 dark:border-zinc-800 animate-in slide-in-from-bottom duration-250`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="w-12 h-1 bg-[#777064]/30 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E4DCCE]/60 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
            <h3 className="font-serif-display font-bold text-base tracking-tight">
              Reading Appearance & Modes
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#777064] dark:text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-sans">
          {/* 1. Presentation Mode: Continuous Scroll vs Single Page */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <span className="text-xs font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
              Reading Layout Mode
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
                    className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${activeRing} bg-[#FAF8F1] dark:bg-zinc-800`
                        : 'border-[#E4DCCE] dark:border-zinc-700/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-[#154D43] dark:text-teal-400" />
                    <div>
                      <div className="text-xs font-bold leading-tight">{m.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{m.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Theme Selector: Warm Ivory, Sepia Paper, Dark Literary */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <span className="text-xs font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider block mb-3">
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
                  border: 'border-[#E4DCCE]',
                },
                {
                  id: 'sepia',
                  label: 'Sepia Paper',
                  icon: Coffee,
                  bg: 'bg-[#FAF4E8]',
                  text: 'text-[#3A3026]',
                  border: 'border-[#E4DCCE]',
                },
                {
                  id: 'dark',
                  label: 'Dark Literary',
                  icon: Moon,
                  bg: 'bg-[#1F1F1D]',
                  text: 'text-[#E8E0D3]',
                  border: 'border-zinc-700',
                },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeTheme(t.id as ReaderTheme)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${t.bg} ${t.text} ${
                      isSelected
                        ? 'ring-2 ring-[#154D43] dark:ring-teal-400 shadow-md font-bold scale-102'
                        : `${t.border} opacity-80 hover:opacity-100`
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Reading Typography / Font Selector */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>Reading Typography</span>
              </span>
              <span className="text-[11px] font-bold text-[#154D43] dark:text-teal-400">
                {READER_FONTS.find((f) => f.id === fontFamily)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {READER_FONTS.map((f) => {
                const isSelected = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChangeFont(f.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${activeRing} bg-[#FAF8F1] dark:bg-zinc-800`
                        : 'border-[#E4DCCE] dark:border-zinc-700/60 hover:bg-black/5 dark:hover:bg-white/5'
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

            {/* Explanatory notice for authentic PDF vector layout */}
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-stone-600 dark:text-zinc-300 flex items-start gap-2 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Applies to reader interface, notes, annotations, and text extraction layer.
                <strong className="font-semibold block mt-0.5">Note:</strong> Original PDF pages retain their author-embedded typographic vector glyphs; scanned or image-based pages cannot be reflowed.
              </span>
            </div>
          </div>

          {/* 4. Zoom Controls for Authentic PDF */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#777064] dark:text-zinc-400 uppercase tracking-wider">
                PDF Page Zoom
              </span>
              <span className="text-xs font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                {zoomPercent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeZoom(Math.max(0.7, parseFloat((zoomScale - 0.15).toFixed(2))))}
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
                onClick={() => onChangeZoom(Math.min(2.0, parseFloat((zoomScale + 0.15).toFixed(2))))}
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
