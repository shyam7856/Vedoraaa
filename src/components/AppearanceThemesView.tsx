import React from 'react';
import {
  ChevronLeft,
  Check,
  Sun,
  Moon,
  Laptop,
  Search,
  Bell,
  Play,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';
import { THEME_CONFIGS, ThemeId, AppearanceMode } from '../utils/themeSystem';

interface AppearanceThemesViewProps {
  onBack: () => void;
  onShowToast?: (msg: string) => void;
}

export const AppearanceThemesView: React.FC<AppearanceThemesViewProps> = ({
  onBack,
  onShowToast,
}) => {
  const { themeId, appearanceMode, isDark, theme, setThemeId, setAppearanceMode } = useTheme();

  const handleSelectTheme = (id: ThemeId) => {
    setThemeId(id);
    onShowToast?.(`Applied ${THEME_CONFIGS[id].name} theme`);
  };

  const handleSelectMode = (mode: AppearanceMode) => {
    setAppearanceMode(mode);
    onShowToast?.(`Switched to ${mode === 'system' ? 'System Default' : mode === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
  };

  const themeList: ThemeId[] = ['forest', 'navy', 'cherry'];

  return (
    <div
      className="flex-1 min-h-full flex flex-col px-4 pt-3 pb-8 animate-in fade-in duration-150 select-none overflow-y-auto no-scrollbar"
      style={{ backgroundColor: theme.bg, color: theme.textPrimary }}
    >
      {/* A. HEADER */}
      <header className="flex items-center gap-3 pt-1 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            color: theme.textPrimary,
          }}
          aria-label="Back to Profile"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div>
          <h1 className="font-serif-display font-bold text-2xl tracking-tight leading-tight">
            Appearance & Themes
          </h1>
          <p className="text-xs font-normal mt-0.5" style={{ color: theme.textSecondary }}>
            Customize the look and feel of Vedora.
          </p>
        </div>
      </header>

      {/* B. THEME SELECTION */}
      <section className="mt-2">
        <div className="mb-2.5">
          <h2 className="text-sm font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Theme
          </h2>
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
            Choose a colour theme for the app.
          </p>
        </div>

        {/* 3 Theme Cards Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {themeList.map((id) => {
            const config = THEME_CONFIGS[id];
            const isSelected = themeId === id;

            return (
              <div
                key={id}
                onClick={() => handleSelectTheme(id)}
                className="rounded-2xl p-2.5 flex flex-col justify-between transition-all cursor-pointer border group active:scale-[0.98]"
                style={{
                  backgroundColor: isDark
                    ? isSelected
                      ? `${config.secondary}20`
                      : 'rgba(255,255,255,0.03)'
                    : isSelected
                    ? `${config.lightBackground}`
                    : 'rgba(255,255,255,0.6)',
                  borderColor: isSelected
                    ? isDark
                      ? config.mutedAccent
                      : config.brandPrimary
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.08)',
                  borderWidth: isSelected ? '2px' : '1px',
                  boxShadow: isSelected
                    ? isDark
                      ? `0 4px 14px -2px ${config.secondary}40`
                      : `0 4px 14px -2px ${config.brandPrimary}25`
                    : 'none',
                }}
              >
                {/* Title & Subtitle */}
                <div className="text-center mb-2">
                  <h3
                    className="font-bold text-[11px] leading-tight truncate"
                    style={{
                      color: isSelected
                        ? isDark
                          ? '#FFFFFF'
                          : config.brandPrimary
                        : theme.textPrimary,
                    }}
                  >
                    {config.name}
                  </h3>
                  <p
                    className="text-[9px] mt-0.5 leading-snug line-clamp-1 opacity-80"
                    style={{ color: theme.textSecondary }}
                  >
                    {config.shortSubtitle}
                  </p>
                </div>

                {/* Mini Realistic UI Preview */}
                <div
                  className="rounded-xl p-2 text-white overflow-hidden shadow-inner flex flex-col justify-between my-1 select-none"
                  style={{
                    backgroundColor: config.brandPrimary,
                    minHeight: '110px',
                  }}
                >
                  {/* Mini Wordmark */}
                  <div className="font-serif-display font-bold text-[10px] tracking-tight leading-none text-white/95">
                    VEDORA
                  </div>

                  {/* Mini Search */}
                  <div className="w-full bg-white/15 rounded-md px-1.5 py-1 flex items-center gap-1 my-1">
                    <Search className="w-2.5 h-2.5 text-white/70 shrink-0" />
                    <span className="text-[7px] text-white/70 truncate">Search your library...</span>
                  </div>

                  {/* Mini Continue Reading Card */}
                  <div
                    className="rounded-lg p-1.5 flex flex-col justify-between border border-white/10"
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between text-[7px] font-semibold text-white/90 mb-1">
                      <span>Continue Reading</span>
                      <ChevronRight className="w-2 h-2 text-white/70" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-6 rounded-xs shrink-0 flex items-center justify-center text-[5px] font-bold border border-white/20"
                        style={{ backgroundColor: config.secondary }}
                      >
                        PDF
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[7.5px] font-bold text-white truncate leading-tight">
                          How to Win an Argument
                        </div>
                        <div className="text-[6px] text-white/70 truncate">102 pages • PDF</div>
                        <div className="mt-1 h-0.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: '33%',
                              backgroundColor: config.mutedAccent,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full bg-white text-stone-900 flex items-center justify-center shrink-0">
                        <Play className="w-1.5 h-1.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radio selection circle */}
                <div className="flex justify-center mt-2 pt-1">
                  {isSelected ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs"
                      style={{
                        backgroundColor: isDark ? config.secondary : config.brandPrimary,
                      }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border-2 transition-colors"
                      style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* C. APPEARANCE MODE */}
      <section className="mt-6">
        <div className="mb-2.5">
          <h2 className="text-sm font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Appearance Mode
          </h2>
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
            Choose how the app looks across your device.
          </p>
        </div>

        {/* 3-Segment Control */}
        <div
          className="p-1 rounded-2xl border flex items-center gap-1"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          {[
            { id: 'light' as AppearanceMode, label: 'Light', icon: Sun },
            { id: 'dark' as AppearanceMode, label: 'Dark', icon: Moon },
            { id: 'system' as AppearanceMode, label: 'System Default', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = appearanceMode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectMode(item.id)}
                className="flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? `${theme.secondary}30`
                      : '#FFFFFF'
                    : 'transparent',
                  color: isSelected
                    ? isDark
                      ? theme.mutedAccent
                      : theme.brandPrimary
                    : theme.textSecondary,
                  borderWidth: isSelected ? '1.5px' : '1px',
                  borderColor: isSelected
                    ? isDark
                      ? theme.mutedAccent
                      : theme.brandPrimary
                    : 'transparent',
                  boxShadow: isSelected && !isDark ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* D. LIVE PREVIEW */}
      <section className="mt-6">
        <div className="mb-2.5">
          <h2 className="text-sm font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Preview
          </h2>
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
            See how the selected theme looks in the app.
          </p>
        </div>

        {/* Large Realistic Preview Container matching mockup in IMG_20261016_145413.png */}
        <div
          className="rounded-3xl p-4 sm:p-5 border shadow-sm transition-all duration-200"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          {/* Top Bar Preview */}
          <div className="flex items-center justify-between pb-3">
            <h3 className="font-serif-display font-bold text-xl tracking-tight leading-none" style={{ color: theme.textPrimary }}>
              VEDORA
            </h3>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: theme.textPrimary,
                }}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div
                className="w-8 h-8 rounded-full text-white font-serif-display font-bold text-xs flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                }}
              >
                V
              </div>
            </div>
          </div>

          {/* Search Box Preview */}
          <div
            className="w-full rounded-2xl px-3 py-2 flex items-center gap-2 mb-3.5 border transition-colors"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Search className="w-4 h-4" style={{ color: theme.textMuted }} />
            <span className="text-xs font-normal" style={{ color: theme.textMuted }}>
              Search your library...
            </span>
          </div>

          {/* Continue Reading Card Preview */}
          <div
            className="rounded-[22px] p-3.5 sm:p-4 text-white shadow-sm relative overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: theme.brandPrimary,
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium text-white/90 mb-2">
              <span className="flex items-center gap-1 font-semibold">
                Continue Reading <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Mini Book Cover Art */}
              <div
                className="w-10 h-14 rounded-md shrink-0 flex flex-col justify-between p-1 text-white border border-white/20 shadow-xs"
                style={{
                  backgroundColor: theme.secondary,
                }}
              >
                <span className="text-[5px] font-black uppercase tracking-widest text-white/80">PDF</span>
                <span className="text-[6px] font-serif-display font-bold leading-tight">Argument</span>
                <span className="text-[5px] opacity-75">102p</span>
              </div>

              {/* Text Info & Progress */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-bold text-sm text-white truncate leading-tight">
                  How to Win an Argument
                </h4>
                <p className="text-white/70 text-[11px] truncate mt-0.5">
                  102 pages • PDF
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-black/35 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: '33%',
                        backgroundColor: theme.mutedAccent,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/90 tabular-nums">33%</span>
                </div>
              </div>

              {/* Play Button */}
              <div className="w-8 h-8 rounded-full bg-white text-stone-900 flex items-center justify-center shadow-md shrink-0">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
