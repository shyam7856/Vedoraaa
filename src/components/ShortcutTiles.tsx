import React from 'react';
import { BookOpen, Heart, FileText, Highlighter } from 'lucide-react';

interface ShortcutTilesProps {
  onSelectCategory: (category: 'all' | 'favorites' | 'notes' | 'highlights') => void;
  activeCategory?: string | null;
}

export const ShortcutTiles: React.FC<ShortcutTilesProps> = ({
  onSelectCategory,
  activeCategory,
}) => {
  const shortcuts = [
    {
      id: 'all' as const,
      label: 'All Books',
      count: '24 files',
      icon: BookOpen,
      bgColor: 'bg-[#EEF6FB]',
      iconColor: 'text-[#2563EB]',
      hoverBg: 'hover:bg-[#E2F0FA]',
      activeRing: 'ring-2 ring-[#2563EB]/40',
    },
    {
      id: 'favorites' as const,
      label: 'Favorites',
      count: '6 files',
      icon: Heart,
      bgColor: 'bg-[#FDEEF1]',
      iconColor: 'text-[#F43F5E]',
      hoverBg: 'hover:bg-[#FCE1E7]',
      activeRing: 'ring-2 ring-[#F43F5E]/40',
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      count: '18 notes',
      icon: FileText,
      bgColor: 'bg-[#FEF7EC]',
      iconColor: 'text-[#D97706]',
      hoverBg: 'hover:bg-[#FDEED5]',
      activeRing: 'ring-2 ring-[#D97706]/40',
    },
    {
      id: 'highlights' as const,
      label: 'Highlights',
      count: '82 items',
      icon: Highlighter,
      bgColor: 'bg-[#EDF8F1]',
      iconColor: 'text-[#059669]',
      hoverBg: 'hover:bg-[#DDF3E5]',
      activeRing: 'ring-2 ring-[#059669]/40',
    },
  ];

  return (
    <section className="mt-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {shortcuts.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className={`${item.bgColor} ${item.hoverBg} ${
                isActive ? item.activeRing : ''
              } rounded-2xl py-3 px-1.5 flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 cursor-pointer shadow-xs`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5">
                <IconComponent className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2.2} />
              </div>
              <span className="font-semibold text-stone-800 text-[11px] leading-tight block truncate w-full px-1">
                {item.label}
              </span>
              <span className="text-[10px] text-stone-500 font-normal mt-0.5 block truncate w-full">
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
