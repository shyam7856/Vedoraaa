import React from 'react';
import { BookOpen, Heart, FileText, Highlighter } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

interface ShortcutTilesProps {
  onSelectCategory: (category: 'all' | 'favorites' | 'notes' | 'highlights') => void;
  activeCategory?: string | null;
  counts?: {
    all: number;
    favorites: number;
    notes: number;
    highlights: number;
  };
}

export const ShortcutTiles: React.FC<ShortcutTilesProps> = ({
  onSelectCategory,
  activeCategory,
  counts,
}) => {
  const { theme, isDark } = useTheme();

  const shortcuts = [
    {
      id: 'all' as const,
      label: 'All Files',
      count: counts ? `${counts.all} ${counts.all === 1 ? 'file' : 'files'}` : 'Library',
      icon: BookOpen,
      iconColor: isDark ? '#93C5FD' : '#2563EB',
      tintBg: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EEF6FB',
    },
    {
      id: 'favorites' as const,
      label: 'Favorites',
      count: counts ? `${counts.favorites} ${counts.favorites === 1 ? 'file' : 'files'}` : 'Favorites',
      icon: Heart,
      iconColor: isDark ? '#FDA4AF' : '#E11D48',
      tintBg: isDark ? 'rgba(225, 29, 72, 0.12)' : '#FDEEF1',
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      count: counts ? `${counts.notes} ${counts.notes === 1 ? 'note' : 'notes'}` : 'Notes',
      icon: FileText,
      iconColor: isDark ? '#FCD34D' : '#D97706',
      tintBg: isDark ? 'rgba(217, 119, 6, 0.12)' : '#FEF7EC',
    },
    {
      id: 'highlights' as const,
      label: 'Highlights',
      count: counts ? `${counts.highlights} ${counts.highlights === 1 ? 'item' : 'items'}` : 'Highlights',
      icon: Highlighter,
      iconColor: isDark ? '#6EE7B7' : '#059669',
      tintBg: isDark ? 'rgba(5, 150, 105, 0.12)' : '#EDF8F1',
    },
  ];

  return (
    <section className="mt-5 select-none">
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {shortcuts.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className="rounded-2xl py-3 px-1.5 flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 cursor-pointer shadow-xs border select-none"
              style={{
                backgroundColor: isDark ? theme.cardBg : item.tintBg,
                borderColor: isActive
                  ? isDark ? theme.mutedAccent : theme.brandPrimary
                  : isDark ? theme.cardBorder : 'transparent',
                boxShadow: isActive
                  ? isDark ? `0 0 0 2px ${theme.mutedAccent}50` : `0 0 0 2px ${theme.brandPrimary}30`
                  : 'none',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5"
                style={{
                  backgroundColor: isDark ? item.tintBg : 'transparent',
                }}
              >
                <IconComponent
                  className="w-5 h-5"
                  style={{ color: item.iconColor }}
                  strokeWidth={2.2}
                />
              </div>
              <span
                className="font-semibold text-[11px] leading-tight block truncate w-full px-1"
                style={{ color: theme.textPrimary }}
              >
                {item.label}
              </span>
              <span
                className="text-[10px] font-normal mt-0.5 block truncate w-full tabular-nums"
                style={{ color: theme.textSecondary }}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
