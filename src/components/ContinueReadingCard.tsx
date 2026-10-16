import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { Book } from '../types';
import { BookCover } from './BookCover';
import { useTheme } from '../utils/ThemeContext';

interface ContinueReadingCardProps {
  book: Book;
  onOpenReader: (book: Book) => void;
  onOpenDetails: (book: Book) => void;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  book,
  onOpenReader,
  onOpenDetails,
}) => {
  const { theme } = useTheme();

  return (
    <div
      onClick={() => onOpenDetails(book)}
      className="text-white rounded-[26px] p-4 sm:p-5 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.99] group select-none"
      style={{
        backgroundColor: theme.brandPrimary,
        boxShadow: `0 8px 24px -4px ${theme.brandPrimary}40`,
      }}
    >
      {/* Subtle organic light reflections */}
      <div
        className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-2xl pointer-events-none opacity-20"
        style={{ backgroundColor: theme.mutedAccent }}
      />
      <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-black/25 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center gap-1 text-[12px] font-medium tracking-wide text-white/90">
          <span>Continue Reading</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/70 stroke-[2.5]" />
        </div>
      </div>

      <div className="flex items-center gap-3.5 relative z-10">
        <div className="shrink-0 drop-shadow-md">
          <BookCover book={book} size="sm" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <h3 className="font-bold text-white text-[15px] sm:text-[16px] leading-[1.25] tracking-tight truncate">
            {book.fileName || book.title}
          </h3>
          <p className="text-white/75 text-xs font-normal mt-0.5 truncate">
            {book.totalPages ? `${book.totalPages} pages • PDF` : book.author}
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${book.progress}%`,
                  backgroundColor: theme.mutedAccent,
                }}
              />
            </div>
            <span className="text-white/90 text-[11px] font-semibold tabular-nums shrink-0">
              {book.progress}%
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenReader(book);
          }}
          aria-label={`Resume reading ${book.title}`}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md shadow-black/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          style={{ color: theme.brandPrimary }}
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </button>
      </div>
    </div>
  );
};
