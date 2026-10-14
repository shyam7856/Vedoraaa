import React, { useState, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

export interface SearchMatchItem {
  page: number;
  textSnippet: string;
  matchIndex: number;
}

interface SearchToolbarProps {
  pdfDoc: PDFDocumentProxy | null;
  totalPages: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMatch: (match: SearchMatchItem | null) => void;
  onShowToast: (msg: string) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  pdfDoc,
  totalPages,
  isOpen,
  onClose,
  onNavigateToMatch,
  onShowToast,
  theme = 'light',
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<SearchMatchItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const searchDebounceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMatches([]);
      setCurrentIndex(0);
      setHasSearched(false);
      onNavigateToMatch(null);
    }
  }, [isOpen, onNavigateToMatch]);

  const performSearch = async (searchTerm: string) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || !pdfDoc) {
      setMatches([]);
      setCurrentIndex(0);
      setHasSearched(false);
      onNavigateToMatch(null);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    const found: SearchMatchItem[] = [];

    try {
      for (let p = 1; p <= totalPages; p++) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        const lowerText = pageText.toLowerCase();

        let startIndex = 0;
        while (startIndex < lowerText.length) {
          const idx = lowerText.indexOf(q, startIndex);
          if (idx === -1) break;

          const snippetStart = Math.max(0, idx - 25);
          const snippetEnd = Math.min(pageText.length, idx + q.length + 35);
          const snippet = pageText.slice(snippetStart, snippetEnd).trim();

          found.push({
            page: p,
            textSnippet: snippet,
            matchIndex: found.length,
          });

          startIndex = idx + q.length;
        }
      }

      setMatches(found);
      if (found.length > 0) {
        setCurrentIndex(0);
        onNavigateToMatch(found[0]);
      } else {
        onNavigateToMatch(null);
      }
    } catch (err) {
      console.warn('Search execution warning:', err);
      onShowToast('Could not complete search on document');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      performSearch(val);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        handleNextMatch();
      } else {
        performSearch(query);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    onNavigateToMatch(matches[next]);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prev = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prev);
    onNavigateToMatch(matches[prev]);
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const barBg = isDark
    ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
    : isSepia
    ? 'bg-[#F5EFEB] border-amber-200/80 text-amber-950'
    : 'bg-[#FAF8F5] border-stone-200 text-stone-900';

  return (
    <div
      className={`absolute top-14 inset-x-2 z-40 p-2 rounded-2xl shadow-xl border flex items-center gap-2 animate-in slide-in-from-top-3 duration-150 ${barBg}`}
    >
      <div className="relative flex-1 flex items-center">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in PDF document..."
          autoFocus
          className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#154D43]"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            className="absolute right-2.5 text-stone-400 hover:text-stone-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-[11px] tabular-nums font-semibold px-1 text-stone-500 dark:text-zinc-400 shrink-0 min-w-[70px] text-center">
        {isSearching ? (
          <div className="flex items-center justify-center gap-1 text-stone-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Finding...</span>
          </div>
        ) : hasSearched && matches.length > 0 ? (
          <span>
            {currentIndex + 1} of {matches.length}
          </span>
        ) : hasSearched && query.trim() ? (
          <span className="text-rose-500 font-medium">0 matches</span>
        ) : (
          <span className="text-stone-400">In document</span>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          disabled={matches.length <= 1}
          onClick={handlePrevMatch}
          className="p-1 rounded-lg hover:bg-stone-200/70 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer text-stone-700 dark:text-zinc-200"
          title="Previous Match"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={matches.length <= 1}
          onClick={handleNextMatch}
          className="p-1 rounded-lg hover:bg-stone-200/70 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer text-stone-700 dark:text-zinc-200"
          title="Next Match"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-0.5 shrink-0" />

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 cursor-pointer shrink-0"
        title="Close Search"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
