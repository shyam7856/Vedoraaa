import React, { useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { HighlightItem, ReaderTheme } from '../../types';
import { SearchMatchItem } from './SearchToolbar';
import { PdfPageItem } from './PdfPageItem';

export interface ContinuousLayoutProps {
  pdfDoc: PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  targetWidth: number;
  aspectRatio: number;
  zoomScale: number;
  rotation: number;
  theme: ReaderTheme;
  highlights: HighlightItem[];
  onSelectHighlight: (hl: HighlightItem) => void;
  activeSearchMatch?: SearchMatchItem | null;
  scrollToPageTarget?: number | null;
  onScrollTargetCompleted?: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ContinuousLayout: React.FC<ContinuousLayoutProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  onPageChange,
  targetWidth,
  aspectRatio,
  zoomScale,
  rotation,
  theme,
  highlights,
  onSelectHighlight,
  activeSearchMatch,
  scrollToPageTarget,
  onScrollTargetCompleted,
  scrollContainerRef,
}) => {
  const pageElementsRef = useRef<{ [page: number]: HTMLDivElement | null }>({});
  const lastReportedPageRef = useRef<number>(currentPage || 1);
  const scrollRafRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const programmaticTimerRef = useRef<any>(null);
  const hasInitialScrolledRef = useRef<boolean>(false);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // Initial scroll position restoration
  useEffect(() => {
    if (hasInitialScrolledRef.current) return;
    hasInitialScrolledRef.current = true;
    const initialTarget = currentPage || 1;
    if (initialTarget > 1) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const el = pageElementsRef.current[initialTarget];
        if (container && el) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetTop = container.scrollTop + (elRect.top - containerRect.top) - 16;
          container.scrollTop = Math.max(0, targetTop);
        }
      }, 80);
    }
  }, [currentPage, scrollContainerRef]);

  // Programmatic scroll to target page (from slider, TOC, search)
  useEffect(() => {
    if (scrollToPageTarget && scrollToPageTarget >= 1 && scrollToPageTarget <= totalPages) {
      const container = scrollContainerRef.current;
      const el = pageElementsRef.current[scrollToPageTarget];
      if (container && el) {
        isProgrammaticScrollRef.current = true;
        if (programmaticTimerRef.current) {
          clearTimeout(programmaticTimerRef.current);
        }

        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetTop = container.scrollTop + (elRect.top - containerRect.top) - 16;

        const pageDistance = Math.abs((lastReportedPageRef.current || 1) - scrollToPageTarget);
        // Jumping more than 2 pages: use instant scroll to avoid intermediate render thrashing
        const behavior = pageDistance > 2 ? 'auto' : 'smooth';

        container.scrollTo({ top: Math.max(0, targetTop), behavior });
        lastReportedPageRef.current = scrollToPageTarget;

        const lockDuration = pageDistance > 2 ? 80 : 380;
        programmaticTimerRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          onScrollTargetCompleted?.();
        }, lockDuration);
      } else {
        onScrollTargetCompleted?.();
      }
    }
  }, [scrollToPageTarget, totalPages, scrollContainerRef, onScrollTargetCompleted]);

  // Scroll listener to track visible page using accurate viewport bounding rects
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current || isProgrammaticScrollRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const probeY = containerRect.top + containerRect.height * 0.35;

      let visiblePage = 1;
      for (let p = 1; p <= totalPages; p++) {
        const el = pageElementsRef.current[p];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= probeY && rect.bottom >= probeY) {
            visiblePage = p;
            break;
          } else if (rect.top > probeY) {
            visiblePage = Math.max(1, p - 1);
            break;
          } else {
            visiblePage = p;
          }
        }
      }

      if (visiblePage !== lastReportedPageRef.current) {
        lastReportedPageRef.current = visiblePage;
        onPageChangeRef.current(visiblePage);
      }
    });
  }, [totalPages, scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    };
  }, [scrollContainerRef, handleScroll]);

  // Pre-render window: Current page and adjacent pages (±2 pages) are rendered with high priority
  const priorityStart = Math.max(1, currentPage - 2);
  const priorityEnd = Math.min(totalPages, currentPage + 3);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center relative py-4 sm:py-6 select-text">
      {pages.map((pageNum) => {
        const isPriority = pageNum >= priorityStart && pageNum <= priorityEnd;
        const pageHighlights = highlights.filter((h) => h.page === pageNum);

        return (
          <PdfPageItem
            key={`page_${pageNum}`}
            pdfDoc={pdfDoc}
            pageNum={pageNum}
            targetWidth={targetWidth}
            aspectRatio={aspectRatio}
            zoomScale={zoomScale}
            rotation={rotation}
            theme={theme}
            highlights={pageHighlights}
            onSelectHighlight={onSelectHighlight}
            activeSearchMatch={activeSearchMatch}
            priority={isPriority}
            scrollContainerRef={scrollContainerRef}
            pageContainerRef={(el) => {
              pageElementsRef.current[pageNum] = el;
            }}
            totalPages={totalPages}
          />
        );
      })}
    </div>
  );
};
