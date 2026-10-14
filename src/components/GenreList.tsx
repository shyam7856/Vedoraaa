import React from 'react';
import { Compass, BarChart3, Palette, Terminal } from 'lucide-react';
import { GenreType } from '../types';

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
  const genres = [
    {
      id: 'Self Help' as GenreType,
      label: 'Self Help',
      icon: Compass,
      bgColor: 'bg-[#FFF3E6]',
      iconColor: 'text-[#EA580C]',
      hoverBg: 'hover:bg-[#FEE8D1]',
      activeRing: 'ring-2 ring-[#EA580C]/40',
    },
    {
      id: 'Business' as GenreType,
      label: 'Business',
      icon: BarChart3,
      bgColor: 'bg-[#EEF2FF]',
      iconColor: 'text-[#4F46E5]',
      hoverBg: 'hover:bg-[#E0E7FF]',
      activeRing: 'ring-2 ring-[#4F46E5]/40',
    },
    {
      id: 'Design' as GenreType,
      label: 'Design',
      icon: Palette,
      bgColor: 'bg-[#FFEAF0]',
      iconColor: 'text-[#E11D48]',
      hoverBg: 'hover:bg-[#FDD5DF]',
      activeRing: 'ring-2 ring-[#E11D48]/40',
    },
    {
      id: 'Tech' as GenreType,
      label: 'Tech',
      icon: Terminal,
      bgColor: 'bg-[#E3F8FA]',
      iconColor: 'text-[#0891B2]',
      hoverBg: 'hover:bg-[#CFF0F4]',
      activeRing: 'ring-2 ring-[#0891B2]/40',
    },
  ];

  return (
    <section className="mt-5 pb-6">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-[17px] font-bold text-stone-900 tracking-tight">
          Browse by Genre
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-[#154D43] hover:text-[#0C322B] transition-colors py-1 cursor-pointer"
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
                className={`w-14 h-14 rounded-2xl ${g.bgColor} ${g.hoverBg} ${
                  isSelected ? g.activeRing : ''
                } flex items-center justify-center transition-all duration-200 shadow-xs mb-2`}
              >
                <IconComponent className={`w-6 h-6 ${g.iconColor}`} strokeWidth={2.2} />
              </div>
              <span
                className={`text-[12px] font-medium leading-tight truncate w-full text-center ${
                  isSelected ? 'text-[#154D43] font-bold' : 'text-stone-800'
                }`}
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
