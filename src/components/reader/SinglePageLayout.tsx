import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HighlightItem, ReaderTheme } from '../../types';
import { SearchMatchItem } from './SearchToolbar';
import { PdfPageItem } from './PdfPageItem';

export interface SinglePageLayoutProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  targetWidth: number;
  aspectRatio: number;
  zoomScale: number;
  rotation: number;
  theme: ReaderTheme;
  highlights: HighlightItem[];
  onSelectHighlight: (hl: HighlightItem, clickInfo?: { clientX: number; clientY: number }) => void;
  pulsingHighlightId?: string | null;
  activeSearchMatch?: SearchMatchItem | null;
  scrollToPageTarget?: number | null;
  onScrollTargetCompleted?: () => void;
}

export const SinglePageLayout: React.FC<SinglePageLayoutProps> = ({
  pdfDoc,
  currentPage,
  totalPages,
  onPageChange,
  targetWidth,
  aspectRatio,
  zoomScale,
  rotation,
  theme,
  highlights,
  onSelectHighlight,
  pulsingHighlightId,
  activeSearchMatch,
  scrollToPageTarget,
  onScrollTargetCompleted,
}) => {
  const validTarget = Math.max(1, Math.min(totalPages, currentPage || 1));
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // If programmatic jump (from TOC, search, slider) is received
  useEffect(() => {
    if (scrollToPageTarget && scrollToPageTarget >= 1 && scrollToPageTarget <= totalPages) {
      if (scrollToPageTarget !== currentPage) {
        onPageChange(scrollToPageTarget);
      }
      onScrollTargetCompleted?.();
    }
  }, [scrollToPageTarget, totalPages, currentPage, onPageChange, onScrollTargetCompleted]);

  // Keyboard navigation: Left/Right arrows, PageUp/PageDown, Space, Home, End
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        if (validTarget > 1) {
          onPageChange(validTarget - 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'j') {
        e.preventDefault();
        if (validTarget < totalPages) {
          onPageChange(validTarget + 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        onPageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        onPageChange(totalPages);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validTarget, totalPages, onPageChange]);

  // Touch Swipe Gesture for mobile readers with horizontal axis validation
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable page swipe when at default zoom (not zoomed in), avoiding accidental page turns
    if (e.touches.length === 1 && zoomScale <= 1.05) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (zoomScale > 1.05 || touchStartXRef.current === null || touchStartYRef.current === null) return;
    
    // Do not trigger page turn if text is selected (Requirement 1)
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Only recognize swipe if horizontal movement is dominant and > 45px
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
      if (diffX < 0 && validTarget < totalPages) {
        // Swiped left -> Next page
        onPageChange(validTarget + 1);
      } else if (diffX > 0 && validTarget > 1) {
        // Swiped right -> Previous page
        onPageChange(validTarget - 1);
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative flex flex-col items-center justify-center min-h-full py-0 select-text w-full"
    >
      {/* Floating Left / Right Turn Buttons */}
      <div className="fixed inset-y-0 left-2 right-2 pointer-events-none z-30 flex items-center justify-between">
        <button
          type="button"
          disabled={validTarget <= 1}
          onClick={() => onPageChange(Math.max(1, validTarget - 1))}
          className={`p-3 rounded-full shadow-lg border backdrop-blur-md pointer-events-auto transition-all cursor-pointer ${
            validTarget <= 1
              ? 'opacity-0 pointer-events-none'
              : theme === 'dark'
              ? 'bg-[#27272A]/90 text-[#E8E0D3] border-zinc-700 hover:bg-zinc-700 active:scale-95'
              : 'bg-[#FBF8F1]/95 text-[#302C26] border-[#E4DCCE] hover:bg-white active:scale-95'
          }`}
          title="Previous Page (Left Arrow or Swipe Right)"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          disabled={validTarget >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, validTarget + 1))}
          className={`p-3 rounded-full shadow-lg border backdrop-blur-md pointer-events-auto transition-all cursor-pointer ${
            validTarget >= totalPages
              ? 'opacity-0 pointer-events-none'
              : theme === 'dark'
              ? 'bg-[#27272A]/90 text-[#E8E0D3] border-zinc-700 hover:bg-zinc-700 active:scale-95'
              : 'bg-[#FBF8F1]/95 text-[#302C26] border-[#E4DCCE] hover:bg-white active:scale-95'
          }`}
          title="Next Page (Right Arrow or Swipe Left)"
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Visible Page with double-buffered rendering */}
      <div className="relative">
        <PdfPageItem
          key={`page_${validTarget}_rot${rotation}_scale${Math.floor(targetWidth)}`}
          pageNum={validTarget}
          pdfDoc={pdfDoc}
          targetWidth={targetWidth}
          aspectRatio={aspectRatio}
          zoomScale={zoomScale}
          rotation={rotation}
          theme={theme}
          highlights={highlights.filter((h) => h.page === validTarget)}
          onSelectHighlight={onSelectHighlight}
          pulsingHighlightId={pulsingHighlightId}
          activeSearchMatch={activeSearchMatch}
          priority={true}
          totalPages={totalPages}
          className="mb-0 border-none shadow-none"
        />
      </div>
    </div>
  );
};
