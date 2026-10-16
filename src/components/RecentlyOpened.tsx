import React from 'react';
import { Book } from '../types';
import { BookCover } from './BookCover';
import { useTheme } from '../utils/ThemeContext';

interface RecentlyOpenedProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onSeeAll?: () => void;
}

export const RecentlyOpened: React.FC<RecentlyOpenedProps> = ({
  books,
  onSelectBook,
  onSeeAll,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-[17px] font-bold tracking-tight" style={{ color: theme.textPrimary }}>
          Recently Opened
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

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 scroll-smooth">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book)}
            className="w-[96px] shrink-0 cursor-pointer group select-none transition-transform active:scale-[0.97]"
          >
            <div className="mb-2 shadow-sm rounded-md transition-shadow group-hover:shadow-md">
              <BookCover book={book} size="md" />
            </div>
            <div className="text-left leading-tight">
              <h4
                className="font-semibold text-[13px] tracking-tight truncate transition-colors"
                style={{ color: theme.textPrimary }}
              >
                {book.fileName || book.title}
              </h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: theme.textSecondary }}>
                {book.totalPages ? `${book.totalPages} pages` : book.author}
              </p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: theme.textMuted }}>
                {book.fileType} • {book.fileSize}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
