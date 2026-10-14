import React from 'react';
import { Book } from '../types';
import { BookCover } from './BookCover';

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
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-[17px] font-bold text-stone-900 tracking-tight">
          Recently Opened
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-[#154D43] hover:text-[#0C322B] transition-colors py-1 cursor-pointer"
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
              <h4 className="font-semibold text-stone-900 text-[13px] tracking-tight truncate group-hover:text-[#154D43] transition-colors">
                {book.id === 'atomic-habits' ? 'Atomic' : book.id === 'design-of-everyday-things' ? 'The Design of' : book.title}
              </h4>
              {book.id === 'design-of-everyday-things' ? (
                <p className="font-semibold text-stone-900 text-[13px] tracking-tight truncate group-hover:text-[#154D43] transition-colors">
                  Everyday Things
                </p>
              ) : (
                <p className="text-stone-500 text-[11px] truncate mt-0.5">
                  {book.author}
                </p>
              )}
              <p className="text-stone-400 text-[10px] mt-0.5 font-medium">
                {book.fileType} • {book.fileSize}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
