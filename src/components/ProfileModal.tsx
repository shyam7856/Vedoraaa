import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  BarChart2,
  Settings,
  HelpCircle,
  Info,
  ChevronRight,
  Check,
  RotateCcw,
  BookOpen,
  Highlighter,
  FileText,
  Bookmark,
  Sparkles,
  Sun,
  Coffee,
  Moon,
  ScrollText,
} from 'lucide-react';
import { ReaderTheme, ReaderViewMode } from '../types';

interface ProfileModalProps {
  onClose: () => void;
  documentsCount: number;
  totalPagesCount: number;
  highlightsCount: number;
  notesCount: number;
  bookmarksCount: number;
  onClearCache?: () => void;
  onShowToast: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  documentsCount,
  totalPagesCount,
  highlightsCount,
  notesCount,
  bookmarksCount,
  onClearCache,
  onShowToast,
}) => {
  const [activeSubView, setActiveSubView] = useState<
    'main' | 'goals' | 'insights' | 'settings' | 'help' | 'about'
  >('main');

  // Reading Goal (pages per day)
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vedora_reading_goal');
      if (saved) return parseInt(saved, 10) || 20;
    } catch {}
    return 20;
  });

  // App default preferences
  const [defaultTheme, setDefaultTheme] = useState<ReaderTheme>(() => {
    try {
      const saved = localStorage.getItem('vedora_reader_theme') as ReaderTheme;
      if (saved && ['light', 'sepia', 'dark'].includes(saved)) return saved;
    } catch {}
    return 'light';
  });

  const [defaultViewMode, setDefaultViewMode] = useState<ReaderViewMode>(() => {
    try {
      const saved = localStorage.getItem('vedora_reader_view_mode') as ReaderViewMode;
      if (saved && ['continuous', 'single'].includes(saved)) return saved;
    } catch {}
    return 'continuous';
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveGoal = (goal: number) => {
    setDailyGoal(goal);
    try {
      localStorage.setItem('vedora_reading_goal', String(goal));
    } catch {}
    onShowToast(`Daily reading goal set to ${goal} pages`);
  };

  const handleSaveDefaultTheme = (theme: ReaderTheme) => {
    setDefaultTheme(theme);
    try {
      localStorage.setItem('vedora_reader_theme', theme);
    } catch {}
    onShowToast(`Default reader theme set to ${theme}`);
  };

  const handleSaveDefaultViewMode = (mode: ReaderViewMode) => {
    setDefaultViewMode(mode);
    try {
      localStorage.setItem('vedora_reader_view_mode', mode);
    } catch {}
    onShowToast(`Default reading mode set to ${mode === 'continuous' ? 'Continuous Scroll' : 'Single Page'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FAF8F5] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border border-stone-200/80 z-10 max-h-[90vh] overflow-y-auto select-none flex flex-col justify-between">
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Back / Close button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/60">
          {activeSubView !== 'main' ? (
            <button
              type="button"
              onClick={() => setActiveSubView('main')}
              className="text-xs font-semibold text-[#154D43] flex items-center gap-1 cursor-pointer hover:underline"
            >
              ← Back to Profile
            </button>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              User Profile
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUB-VIEW 1: MAIN PROFILE VIEW */}
        {activeSubView === 'main' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-3.5 mt-1">
              <div className="w-14 h-14 rounded-full bg-[#154D43] text-white flex items-center justify-center text-xl font-bold shadow-sm font-serif-display">
                V
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg leading-snug">Reader Space</h3>
                <p className="text-stone-500 text-xs">Private local library on this device</p>
              </div>
            </div>

            {/* REAL CALCULATED STATS */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F2EFE9] rounded-2xl text-center">
              <div>
                <span className="block text-lg font-bold text-stone-900 tabular-nums">
                  {documentsCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Documents</span>
              </div>
              <div className="border-x border-stone-300/60">
                <span className="block text-lg font-bold text-stone-900 tabular-nums">
                  {highlightsCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Highlights</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-stone-900 tabular-nums">
                  {notesCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Notes</span>
              </div>
            </div>

            {/* INTERACTIVE CONTROLS */}
            <div className="space-y-1">
              {[
                {
                  id: 'goals' as const,
                  label: 'Reading goals',
                  sub: `${dailyGoal} pages / day`,
                  icon: Target,
                },
                {
                  id: 'insights' as const,
                  label: 'Reading insights',
                  sub: `${totalPagesCount} total pages available`,
                  icon: BarChart2,
                },
                {
                  id: 'settings' as const,
                  label: 'App settings',
                  sub: 'Theme, reader layout, storage',
                  icon: Settings,
                },
                {
                  id: 'help' as const,
                  label: 'Help & Quick Guide',
                  sub: 'Gestures, highlighting, shortcuts',
                  icon: HelpCircle,
                },
                {
                  id: 'about' as const,
                  label: 'About VEDORA',
                  sub: 'v2.4.0 • Local PDF Reader',
                  icon: Info,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubView(item.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-200/60 transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-200/70 group-hover:bg-[#154D43]/10 text-stone-700 group-hover:text-[#154D43] flex items-center justify-center transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-900 block leading-tight">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-stone-500">{item.sub}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: READING GOALS */}
        {activeSubView === 'goals' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#154D43]" />
              <h4 className="font-serif-display font-bold text-base text-stone-900">
                Daily Reading Goals
              </h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Set how many pages you aim to read every day to build a consistent reading habit.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">Daily Target</span>
                <span className="text-base font-bold text-[#154D43] tabular-nums">
                  {dailyGoal} pages / day
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 35, 50].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => handleSaveGoal(goal)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      dailyGoal === goal
                        ? 'bg-[#154D43] text-white border-[#154D43] shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {goal} p.
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-teal-50 border border-teal-200/80 rounded-2xl text-xs text-teal-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                Reading just {dailyGoal} pages a day lets you finish an average 250-page book in about {Math.round(250 / dailyGoal)} days!
              </span>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: READING INSIGHTS */}
        {activeSubView === 'insights' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#154D43]" />
              <h4 className="font-serif-display font-bold text-base text-stone-900">
                Library Insights
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center">
                <BookOpen className="w-4 h-4 text-[#154D43] mx-auto mb-1" />
                <span className="block text-xl font-bold text-stone-900 tabular-nums">
                  {documentsCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Stored Documents</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center">
                <FileText className="w-4 h-4 text-[#154D43] mx-auto mb-1" />
                <span className="block text-xl font-bold text-stone-900 tabular-nums">
                  {totalPagesCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Total Pages</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center">
                <Highlighter className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="block text-xl font-bold text-stone-900 tabular-nums">
                  {highlightsCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Saved Highlights</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center">
                <Bookmark className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <span className="block text-xl font-bold text-stone-900 tabular-nums">
                  {bookmarksCount}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Bookmarked Pages</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 text-center pt-1">
              All metrics reflect user-imported files and annotations saved on this device.
            </p>
          </div>
        )}

        {/* SUB-VIEW 4: APP SETTINGS */}
        {activeSubView === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#154D43]" />
              <h4 className="font-serif-display font-bold text-base text-stone-900">
                App & Reader Settings
              </h4>
            </div>

            {/* Default Theme */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-2">
                Default Reader Theme
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light' as const, label: 'Warm Ivory', icon: Sun },
                  { id: 'sepia' as const, label: 'Sepia Paper', icon: Coffee },
                  { id: 'dark' as const, label: 'Dark Literary', icon: Moon },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSaveDefaultTheme(t.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        defaultTheme === t.id
                          ? 'border-[#154D43] bg-teal-50 text-[#154D43] font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default Reading Mode */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-2">
                Default Layout Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'continuous' as const, label: 'Continuous Scroll', icon: ScrollText },
                  { id: 'single' as const, label: 'Single Page', icon: FileText },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSaveDefaultViewMode(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        defaultViewMode === m.id
                          ? 'border-[#154D43] bg-teal-50 text-[#154D43] font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset / Cache */}
            <div className="pt-2">
              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-2.5 px-3 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Cached Reader State</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <p className="text-xs text-rose-800 font-medium">
                    Reset cached zoom and view preferences? Your PDF documents and saved notes will remain safe.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-1.5 text-xs text-stone-600 bg-white border border-stone-200 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem('vedora_reader_view_mode');
                          localStorage.removeItem('vedora_reader_theme');
                          localStorage.removeItem('vedora_reader_font');
                        } catch {}
                        setShowClearConfirm(false);
                        onShowToast('Reset reader preferences to default');
                      }}
                      className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB-VIEW 5: HELP & GUIDE */}
        {activeSubView === 'help' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#154D43]" />
              <h4 className="font-serif-display font-bold text-base text-stone-900">
                Help & Quick Guide
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-stone-200">
                <h5 className="font-bold text-stone-900 mb-0.5">Importing PDFs</h5>
                <p className="text-stone-500 leading-relaxed">
                  Tap "Import PDF" in the Library or Home to pick any PDF from your Android device storage. Documents are saved locally on your phone.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-stone-200">
                <h5 className="font-bold text-stone-900 mb-0.5">Highlighting Text</h5>
                <p className="text-stone-500 leading-relaxed">
                  Select text with your finger or mouse cursor to open the 5-color pastel toolbar. Tap a color dot to save the highlight. Tap any saved highlight to delete or copy it.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-stone-200">
                <h5 className="font-bold text-stone-900 mb-0.5">Navigation</h5>
                <p className="text-stone-500 leading-relaxed">
                  Use the bottom slider or the "Contents" drawer to jump directly to any chapter, milestone (Start, 25%, 50%, 75%), or page number.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-stone-200">
                <h5 className="font-bold text-stone-900 mb-0.5">Notes & Markdown Export</h5>
                <p className="text-stone-500 leading-relaxed">
                  Attach quotes to your thoughts in the "Note" drawer. In the "More" drawer, export all your highlights and notes as a clean Markdown (.md) file anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 6: ABOUT VEDORA */}
        {activeSubView === 'about' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-[#154D43] text-white flex items-center justify-center text-2xl font-bold font-serif-display mx-auto shadow-md">
              V
            </div>
            <div>
              <h4 className="font-serif-display font-bold text-xl text-stone-900">
                VEDORA
              </h4>
              <p className="text-stone-500 text-xs mt-0.5">Your Reading Space • Version 2.4.0</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 text-left text-xs space-y-2 text-stone-600 leading-relaxed">
              <p>
                VEDORA is a mobile-first, distraction-free PDF reading space engineered for focused reading, text highlighting, and note-taking.
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Privacy:</span>
                <span className="font-semibold text-[#154D43]">100% On-Device Storage</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>Rendering Engine:</span>
                <span className="font-semibold">Mozilla PDF.js 4</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>Android Integration:</span>
                <span className="font-semibold">Document Picker & WebView</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400">
              Designed with warm literary aesthetics for passionate readers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
