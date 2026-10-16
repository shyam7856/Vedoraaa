import React from 'react';
import { Compass, BarChart3, Palette, Terminal } from 'lucide-react';
import { GenreType } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface GenreListProps {
  onSelectGenre: (genre: GenreType | null) => void;
  selectedGenre: GenreType | null;
  onSeeAll?: () => void;
}

export const GenreList: React.FC<GenreListProps> = ({
  onSelectGenre,
  selectedGenre,
  onSeeAll,
}) => {
  const { theme, isDark } = useTheme();

  const genres = [
    {
      id: 'Self Help' as GenreType,
      label: 'Self Help',
      icon: Compass,
      bgColor: isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF3E6',
      iconColor: isDark ? '#FB923C' : '#EA580C',
    },
    {
      id: 'Business' as GenreType,
      label: 'Business',
      icon: BarChart3,
      bgColor: isDark ? 'rgba(79, 70, 229, 0.12)' : '#EEF2FF',
      iconColor: isDark ? '#818CF8' : '#4F46E5',
    },
    {
      id: 'Design' as GenreType,
      label: 'Design',
      icon: Palette,
      bgColor: isDark ? 'rgba(225, 29, 72, 0.12)' : '#FFEAF0',
      iconColor: isDark ? '#FB7185' : '#E11D48',
    },
    {
      id: 'Tech' as GenreType,
      label: 'Tech',
      icon: Terminal,
      bgColor: isDark ? 'rgba(8, 145, 178, 0.12)' : '#E3F8FA',
      iconColor: isDark ? '#38BDF8' : '#0891B2',
    },
  ];

  return (
    <section className="mt-5 pb-6">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-[17px] font-bold tracking-tight" style={{ color: theme.textPrimary }}>
          Browse by Genre
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold transition-colors py-1 cursor-pointer"
          style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
        >
          See all
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {genres.map((g) => {
          const IconComponent = g.icon;
          const isSelected = selectedGenre === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGenre(isSelected ? null : g.id)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-xs mb-2 border"
                style={{
                  backgroundColor: g.bgColor,
                  borderColor: isSelected
                    ? isDark ? theme.mutedAccent : theme.brandPrimary
                    : 'transparent',
                  boxShadow: isSelected
                    ? isDark
                      ? `0 0 0 2px ${theme.mutedAccent}`
                      : `0 0 0 2px ${theme.brandPrimary}`
                    : 'none',
                }}
              >
                <IconComponent className="w-6 h-6" style={{ color: g.iconColor }} strokeWidth={2.2} />
              </div>
              <span
                className="text-[12px] font-medium leading-tight truncate w-full text-center"
                style={{
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected
                    ? isDark ? theme.mutedAccent : theme.brandPrimary
                    : theme.textPrimary,
                }}
              >
                {g.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
