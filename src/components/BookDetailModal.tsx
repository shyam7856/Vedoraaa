import React from 'react';
import { X, Play, Heart } from 'lucide-react';
import { Book } from '../types';
import { BookCover } from './BookCover';

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
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FAF8F5] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border border-stone-200/80 z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-5 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex gap-4 items-start">
          <div className="shrink-0 shadow-md rounded-md overflow-hidden">
            <BookCover book={book} size="md" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
              {book.genre}
            </span>
            <h3 className="font-bold text-stone-900 text-lg leading-snug mt-1.5 break-words">
              {book.fileName || book.title}
            </h3>
            <p className="text-stone-600 text-sm mt-0.5">{book.author}</p>
            <p className="text-stone-400 text-xs mt-1">
              {book.fileType} • {book.fileSize}
            </p>
          </div>
        </div>
        <div className="mt-5 p-4 bg-[#F2EFE9] rounded-2xl">
          <div className="flex items-center justify-between text-xs font-medium text-stone-700 mb-1.5">
            <span>Reading Progress</span>
            <span className="font-bold text-[#154D43] tabular-nums">{book.progress}%</span>
          </div>
          <div className="w-full h-2 bg-stone-300/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#154D43] rounded-full transition-all duration-300"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2">
            <span>
              Page {Math.round((book.progress / 100) * book.totalPages)} of {book.totalPages}
            </span>
            <span>{book.lastOpened ? `Opened ${book.lastOpened}` : 'Not started'}</span>
          </div>
        </div>
        {book.quote && (
          <div className="mt-4 p-3 bg-stone-100/80 rounded-xl border-l-2 border-[#154D43] text-stone-700 italic text-xs leading-relaxed">
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
            className="flex-1 h-12 bg-[#154D43] hover:bg-[#0E3A32] active:scale-[0.98] text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{book.progress > 0 ? 'Resume Reading' : 'Start Reading'}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite(book.id)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
              book.isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-500'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title="Favorite"
          >
            <Heart className={`w-5 h-5 ${book.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
