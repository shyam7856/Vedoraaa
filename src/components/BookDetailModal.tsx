import React from 'react';
import { X, Play, Heart } from 'lucide-react';
import { Book } from '../types';
import { BookCover } from './BookCover';
import { useTheme } from '../utils/ThemeContext';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onOpenReader: (book: Book) => void;
  onToggleFavorite: (bookId: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onOpenReader,
  onToggleFavorite,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border z-10 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: theme.bg,
          color: theme.textPrimary,
          borderColor: theme.cardBorder,
        }}
      >
        <div
          className="w-12 h-1 rounded-full mx-auto mb-5 sm:hidden"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: theme.textPrimary,
          }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex gap-4 items-start">
          <div className="shrink-0 shadow-md rounded-md overflow-hidden">
            <BookCover book={book} size="md" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <span
              className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                color: isDark ? theme.mutedAccent : theme.brandPrimary,
              }}
            >
              {book.genre || 'PDF'}
            </span>
            <h3 className="font-bold text-lg leading-snug mt-1.5 break-words" style={{ color: theme.textPrimary }}>
              {book.fileName || book.title}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
              {book.author}
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              {book.fileType} • {book.fileSize}
            </p>
          </div>
        </div>
        <div
          className="mt-5 p-4 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
            <span>Reading Progress</span>
            <span
              className="font-bold tabular-nums"
              style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
            >
              {book.progress}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${book.progress}%`,
                backgroundColor: isDark ? theme.mutedAccent : theme.brandPrimary,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2" style={{ color: theme.textMuted }}>
            <span>
              Page {Math.round((book.progress / 100) * book.totalPages)} of {book.totalPages}
            </span>
            <span>{book.lastOpened ? `Recently read` : 'Not started'}</span>
          </div>
        </div>
        {book.quote && (
          <div
            className="mt-4 p-3 rounded-xl border-l-2 italic text-xs leading-relaxed"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderLeftColor: isDark ? theme.mutedAccent : theme.brandPrimary,
              color: theme.textSecondary,
            }}
          >
            “{book.quote}”
          </div>
        )}
        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReader(book);
            }}
            className="flex-1 h-12 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            style={{
              backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
            }}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{book.progress > 0 ? 'Resume Reading' : 'Start Reading'}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite(book.id)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer"
            style={{
              backgroundColor: book.isFavorite
                ? isDark ? 'rgba(225, 29, 72, 0.2)' : '#FFE4E6'
                : theme.cardBg,
              borderColor: book.isFavorite
                ? '#FB7185'
                : theme.cardBorder,
              color: book.isFavorite ? '#E11D48' : theme.textSecondary,
            }}
            title="Favorite"
          >
            <Heart className={`w-5 h-5 ${book.isFavorite ? 'fill-[#E11D48]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
