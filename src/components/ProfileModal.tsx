import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  BarChart2,
  Settings,
  Info,
  ChevronRight,
  BookOpen,
  Highlighter,
  FileText,
  Bookmark,
  Palette,
  RotateCcw,
  Bell,
  Sun,
  Moon,
  Coffee,
  ScrollText,
} from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';
import { AppearanceThemesView } from './AppearanceThemesView';
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
  onShowToast,
}) => {
  const { theme, isDark } = useTheme();
  const [activeSubView, setActiveSubView] = useState<
    'main' | 'appearance' | 'goals' | 'insights' | 'settings' | 'about'
  >('main');

  useEffect(() => {
    (window as any).__vedoraProfileBackHandler = () => {
      if (activeSubView !== 'main') {
        setActiveSubView('main');
        return true;
      }
      return false;
    };
    return () => {
      delete (window as any).__vedoraProfileBackHandler;
    };
  }, [activeSubView]);

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

  const handleSaveDefaultTheme = (t: ReaderTheme) => {
    setDefaultTheme(t);
    try {
      localStorage.setItem('vedora_reader_theme', t);
    } catch {}
    onShowToast(`Default reader theme set to ${t}`);
  };

  const handleSaveDefaultViewMode = (mode: ReaderViewMode) => {
    setDefaultViewMode(mode);
    try {
      localStorage.setItem('vedora_reader_view_mode', mode);
    } catch {}
    onShowToast(`Default reading mode set to ${mode === 'continuous' ? 'Continuous Scroll' : 'Single Page'}`);
  };

  // If viewing Appearance & Themes dedicated screen
  if (activeSubView === 'appearance') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />
        <div
          className="relative w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] shadow-2xl border-t sm:border z-10 h-full sm:h-[840px] max-h-[94vh] overflow-hidden flex flex-col"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.cardBorder,
          }}
        >
          <AppearanceThemesView
            onBack={() => setActiveSubView('main')}
            onShowToast={onShowToast}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl border-t sm:border z-10 max-h-[92vh] overflow-y-auto select-none flex flex-col justify-between"
        style={{
          backgroundColor: theme.bg,
          color: theme.textPrimary,
          borderColor: theme.cardBorder,
        }}
      >
        <div
          className="w-12 h-1 rounded-full mx-auto mb-3 sm:hidden"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}
        />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b" style={{ borderColor: theme.cardBorder }}>
          {activeSubView !== 'main' ? (
            <button
              type="button"
              onClick={() => setActiveSubView('main')}
              className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline"
              style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
            >
              ← Back to Profile
            </button>
          ) : (
            <div>
              <h2 className="font-serif-display font-bold text-xl tracking-tight leading-tight" style={{ color: theme.textPrimary }}>
                VEDORA
              </h2>
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                Your reading space
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: theme.textPrimary,
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUB-VIEW 1: MAIN PROFILE VIEW */}
        {activeSubView === 'main' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3.5 mt-1">
              <div
                className="w-14 h-14 rounded-full text-white flex items-center justify-center text-xl font-bold shadow-xs font-serif-display shrink-0"
                style={{
                  backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                }}
              >
                V
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-snug truncate" style={{ color: theme.textPrimary }}>
                  Reader Space
                </h3>
                <p className="text-xs truncate" style={{ color: theme.textSecondary }}>
                  Private local library on this device
                </p>
              </div>
            </div>

            {/* REAL CALCULATED STATS */}
            <div
              className="grid grid-cols-3 gap-2 p-3 rounded-2xl text-center border"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <div>
                <span className="block text-lg font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {documentsCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>
                  Documents
                </span>
              </div>
              <div className="border-x" style={{ borderColor: theme.cardBorder }}>
                <span className="block text-lg font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {highlightsCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>
                  Highlights
                </span>
              </div>
              <div>
                <span className="block text-lg font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {notesCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>
                  Notes
                </span>
              </div>
            </div>

            {/* SECTION 1: READING */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1" style={{ color: theme.textMuted }}>
                Reading
              </span>
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
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSubView(item.id)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer text-left group border"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            color: isDark ? theme.mutedAccent : theme.brandPrimary,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block leading-tight" style={{ color: theme.textPrimary }}>
                            {item.label}
                          </span>
                          <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {item.sub}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: PREFERENCES (Dedicated Appearance & Themes entry) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1" style={{ color: theme.textMuted }}>
                Preferences
              </span>
              <button
                type="button"
                onClick={() => setActiveSubView('appearance')}
                className="w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer text-left group border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: isDark ? theme.mutedAccent : theme.brandPrimary,
                  borderWidth: '1.5px',
                  boxShadow: isDark
                    ? `0 4px 12px -2px ${theme.secondary}30`
                    : `0 4px 12px -2px ${theme.brandPrimary}15`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-colors shadow-xs"
                    style={{
                      backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                    }}
                  >
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight" style={{ color: theme.textPrimary }}>
                      Appearance & Themes
                    </span>
                    <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                      Forest Green, Navy Blue, Black Cherry
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
              </button>
            </div>

            {/* SECTION 3: SETTINGS */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1" style={{ color: theme.textMuted }}>
                Settings
              </span>
              <button
                type="button"
                onClick={() => setActiveSubView('settings')}
                className="w-full flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer text-left group border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      color: isDark ? theme.mutedAccent : theme.brandPrimary,
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold block leading-tight" style={{ color: theme.textPrimary }}>
                      App settings
                    </span>
                    <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                      Reader layout, fonts, storage
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
              </button>
            </div>

            {/* SECTION 4: ABOUT */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1" style={{ color: theme.textMuted }}>
                About
              </span>
              <button
                type="button"
                onClick={() => setActiveSubView('about')}
                className="w-full flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer text-left group border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      color: isDark ? theme.mutedAccent : theme.brandPrimary,
                    }}
                  >
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold block leading-tight" style={{ color: theme.textPrimary }}>
                      About Vedora
                    </span>
                    <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                      v2.5.0 • Editorial PDF Reader
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: READING GOALS */}
        {activeSubView === 'goals' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
              <h4 className="font-serif-display font-bold text-base" style={{ color: theme.textPrimary }}>
                Daily Reading Goals
              </h4>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              Set how many pages you aim to read every day to build a consistent reading habit.
            </p>

            <div
              className="p-4 rounded-2xl border space-y-3"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: theme.textSecondary }}>Daily Target</span>
                <span className="text-base font-bold tabular-nums" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}>
                  {dailyGoal} pages / day
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 35, 50].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => handleSaveGoal(goal)}
                    className="py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center"
                    style={{
                      backgroundColor: dailyGoal === goal
                        ? isDark ? theme.secondary : theme.brandPrimary
                        : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      color: dailyGoal === goal ? '#FFFFFF' : theme.textPrimary,
                      borderColor: dailyGoal === goal
                        ? isDark ? theme.mutedAccent : theme.brandPrimary
                        : theme.cardBorder,
                    }}
                  >
                    {goal} p.
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: READING INSIGHTS */}
        {activeSubView === 'insights' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
              <h4 className="font-serif-display font-bold text-base" style={{ color: theme.textPrimary }}>
                Library Insights
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="p-3 rounded-2xl border text-center"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <BookOpen className="w-4 h-4 mx-auto mb-1" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
                <span className="block text-xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {documentsCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>Stored Documents</span>
              </div>
              <div
                className="p-3 rounded-2xl border text-center"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <FileText className="w-4 h-4 mx-auto mb-1" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
                <span className="block text-xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {totalPagesCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>Total Pages</span>
              </div>
              <div
                className="p-3 rounded-2xl border text-center"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <Highlighter className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="block text-xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {highlightsCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>Saved Highlights</span>
              </div>
              <div
                className="p-3 rounded-2xl border text-center"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <Bookmark className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                <span className="block text-xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                  {bookmarksCount}
                </span>
                <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>Bookmarked Pages</span>
              </div>
            </div>

            <p className="text-[11px] text-center pt-1" style={{ color: theme.textMuted }}>
              All metrics reflect user-imported files and annotations saved on this device.
            </p>
          </div>
        )}

        {/* SUB-VIEW 4: APP SETTINGS */}
        {activeSubView === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
              <h4 className="font-serif-display font-bold text-base" style={{ color: theme.textPrimary }}>
                App & Reader Settings
              </h4>
            </div>

            {/* Default Reading Mode */}
            <div
              className="p-3.5 rounded-2xl border"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: theme.textSecondary }}>
                Default Reader Layout
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'continuous' as const, label: 'Continuous Scroll', icon: ScrollText },
                  { id: 'single' as const, label: 'Single Page', icon: FileText },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = defaultViewMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSaveDefaultViewMode(m.id)}
                      className="p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected
                          ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}12`
                          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        color: isSelected
                          ? isDark ? theme.mutedAccent : theme.brandPrimary
                          : theme.textSecondary,
                        borderColor: isSelected
                          ? isDark ? theme.mutedAccent : theme.brandPrimary
                          : theme.cardBorder,
                      }}
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
                  className="w-full py-2.5 px-3 text-xs font-medium text-rose-600 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Cached Reader State</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                  <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                    Reset cached zoom and view preferences? Your PDF documents and saved notes will remain safe.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-1.5 text-xs rounded-xl border"
                      style={{
                        backgroundColor: theme.cardBg,
                        color: theme.textPrimary,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem('vedora_reader_view_mode');
                          localStorage.removeItem('vedora_reader_font');
                        } catch {}
                        setShowClearConfirm(false);
                        onShowToast('Reset reader preferences to default');
                      }}
                      className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB-VIEW 5: ABOUT VEDORA */}
        {activeSubView === 'about' && (
          <div className="space-y-3.5 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
              <h4 className="font-serif-display font-bold text-base" style={{ color: theme.textPrimary }}>
                About VEDORA
              </h4>
            </div>

            <div
              className="p-3.5 rounded-2xl border space-y-2 leading-relaxed"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <div className="font-bold text-sm" style={{ color: theme.textPrimary }}>
                VEDORA v2.5.0
              </div>
              <p style={{ color: theme.textSecondary }}>
                A refined, editorial reading space designed for personal PDF documents, research papers, and literary books.
              </p>
              <div className="pt-2 border-t text-[11px] space-y-1" style={{ borderColor: theme.cardBorder, color: theme.textMuted }}>
                <div>• Private on-device document storage</div>
                <div>• 3 Curated Palettes: Forest Green, Navy Blue, Black Cherry</div>
                <div>• Offline PDF vector rendering & native text selection</div>
                <div>• Persistent highlights, notes, and reading progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
