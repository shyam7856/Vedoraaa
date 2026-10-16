import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { AlertCircle, RotateCw, Info, Search } from 'lucide-react';
import { HighlightItem, ReaderTheme, PASTEL_COLORS } from '../../types';
import { renderPdfPageComplete } from '../../utils/pdfRenderer';
import { SearchMatchItem } from './SearchToolbar';

export interface PdfPageItemProps {
  pdfDoc: PDFDocumentProxy;
  pageNum: number;
  targetWidth: number;
  aspectRatio: number;
  zoomScale: number;
  rotation: number;
  theme: ReaderTheme;
  highlights: HighlightItem[];
  onSelectHighlight: (hl: HighlightItem, clickInfo?: { clientX: number; clientY: number }) => void;
  pulsingHighlightId?: string | null;
  activeSearchMatch?: SearchMatchItem | null;
  priority?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onRenderSuccess?: (pageNum: number) => void;
  onRenderError?: (pageNum: number, error: string) => void;
  pageContainerRef?: (el: HTMLDivElement | null) => void;
  totalPages: number;
  className?: string;
}

export const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pdfDoc,
  pageNum,
  targetWidth,
  aspectRatio,
  zoomScale,
  rotation,
  theme,
  highlights,
  onSelectHighlight,
  pulsingHighlightId,
  activeSearchMatch,
  priority = false,
  scrollContainerRef,
  onRenderSuccess,
  onRenderError,
  pageContainerRef,
  totalPages,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'rendering' | 'rendered' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState<boolean>(false);
  const [showOcrNotice, setShowOcrNotice] = useState<boolean>(false);
  const isRenderingRef = useRef<boolean>(false);
  const pendingRenderRef = useRef<boolean>(false);
  const renderedKeyRef = useRef<string>('');

  const renderKey = `${pageNum}_${zoomScale}_${rotation}_${Math.floor(targetWidth)}`;
  const pageWidth = Math.max(120, Math.floor(targetWidth));
  const [actualDimensions, setActualDimensions] = useState<{ width: number; height: number } | null>(null);
  const pageHeight = actualDimensions
    ? actualDimensions.height
    : Math.max(160, Math.floor(pageWidth * aspectRatio));

  const pageContainerBg =
    theme === 'dark' ? '#1E1E22' : theme === 'sepia' ? '#FAF4E8' : '#ffffff';
  const canvasFilter =
    theme === 'dark'
      ? 'invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.95)'
      : theme === 'sepia'
      ? 'sepia(0.25) contrast(0.96) brightness(0.98)'
      : 'none';

  const doRender = useCallback(
    async (force = false) => {
      const canvas = canvasRef.current;
      const textLayer = textLayerRef.current;
      if (!canvas) return;
      if (!force && renderedKeyRef.current === renderKey) return;
      if (isRenderingRef.current) {
        pendingRenderRef.current = true;
        return;
      }

      isRenderingRef.current = true;
      setStatus((prev) => (renderedKeyRef.current ? 'rendered' : 'rendering'));
      setErrorMsg(null);

      try {
        const result = await renderPdfPageComplete(
          pdfDoc,
          pageNum,
          canvas,
          textLayer,
          pageWidth,
          1.0,
          rotation
        );

        if (result.cancelled) {
          setStatus((prev) => (renderedKeyRef.current ? 'rendered' : 'idle'));
          return;
        }

        if (result.error) {
          setErrorMsg(result.error);
          setStatus('error');
          onRenderError?.(pageNum, result.error);
        } else {
          renderedKeyRef.current = renderKey;
          setActualDimensions({ width: result.width, height: result.height });
          setStatus('rendered');
          if (!result.hasText) {
            setIsScanned(true);
          }
          onRenderSuccess?.(pageNum);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render exception:`, err);
          setErrorMsg(err?.message || 'Failed to render page');
          setStatus('error');
          onRenderError?.(pageNum, err?.message || 'Failed to render page');
        } else {
          setStatus((prev) => (renderedKeyRef.current ? 'rendered' : 'idle'));
        }
      } finally {
        isRenderingRef.current = false;
        if (pendingRenderRef.current) {
          pendingRenderRef.current = false;
          requestAnimationFrame(() => {
            doRender();
          });
        }
      }
    },
    [pdfDoc, pageNum, pageWidth, zoomScale, rotation, renderKey, onRenderSuccess, onRenderError]
  );

  // If priority page, render immediately
  useEffect(() => {
    if (priority || renderedKeyRef.current !== '') {
      doRender();
    }
  }, [priority, renderKey, doRender]);

  // If non-priority page, render when within 1000px viewport margin
  useEffect(() => {
    if (priority) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (renderedKeyRef.current !== renderKey && !isRenderingRef.current) {
              doRender();
            }
          }
        });
      },
      {
        root: scrollContainerRef?.current || null,
        threshold: 0,
        rootMargin: '1000px 0px 1000px 0px',
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [priority, renderKey, scrollContainerRef, doRender]);

  // Touch tracking to distinguish tap from drag/swipe
  const touchStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = (clientX: number, clientY: number) => {
    touchStartPosRef.current = { x: clientX, y: clientY, time: Date.now() };
  };

  const checkHighlightHit = (clientX: number, clientY: number): boolean => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      return false;
    }

    const container = containerRef.current;
    if (!container || highlights.length === 0) return false;

    const pageRect = container.getBoundingClientRect();
    const clickX = ((clientX - pageRect.left) / pageRect.width) * 100;
    const clickY = ((clientY - pageRect.top) / pageRect.height) * 100;

    // Check highlights in reverse order (most recent first)
    for (let i = highlights.length - 1; i >= 0; i--) {
      const hl = highlights[i];
      if (!hl.rects || hl.rects.length === 0) continue;
      const hit = hl.rects.some(
        (r) =>
          clickX >= r.left - 1.5 &&
          clickX <= r.left + r.width + 1.5 &&
          clickY >= r.top - 1.5 &&
          clickY <= r.top + r.height + 1.5
      );
      if (hit) {
        onSelectHighlight(hl, { clientX, clientY });
        return true;
      }
    }
    return false;
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    checkHighlightHit(e.clientX, e.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPosRef.current) return;
    const start = touchStartPosRef.current;
    touchStartPosRef.current = null;

    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dist = Math.hypot(touch.clientX - start.x, touch.clientY - start.y);
      const timeDiff = Date.now() - start.time;
      // If it was a quick tap (< 350ms and moved < 10px), check highlight hit
      if (dist < 10 && timeDiff < 350) {
        checkHighlightHit(touch.clientX, touch.clientY);
      }
    }
  };

  return (
    <div
      id={`vedora-pdf-page-${pageNum}`}
      data-page-number={pageNum}
      ref={(el) => {
        containerRef.current = el;
        pageContainerRef?.(el);
      }}
      onClick={handlePageClick}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handleTouchEnd}
      className={`relative mx-auto select-text ${className}`}
      style={{
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        backgroundColor: pageContainerBg,
      }}
    >
      {/* Active Search Match Indicator */}
      {activeSearchMatch && activeSearchMatch.page === pageNum && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-stone-900 font-semibold text-[11px] px-3 py-1 rounded-full shadow-lg z-30 flex items-center gap-1.5 animate-bounce pointer-events-none">
          <Search className="w-3 h-3 text-stone-900" />
          <span>Match: “{activeSearchMatch.textSnippet.slice(0, 32)}...”</span>
        </div>
      )}

      {/* Loading placeholder before first render */}
      {status === 'idle' || (status === 'rendering' && renderedKeyRef.current === '') ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-stone-400 dark:text-zinc-600">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-zinc-700 border-t-[#154D43] dark:border-t-teal-400 animate-spin mb-2" />
          <span className="text-[11px] font-sans">Page {pageNum}</span>
        </div>
      ) : null}

      {status === 'error' && errorMsg ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-stone-600 h-full">
          <AlertCircle className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-xs font-semibold text-stone-800 dark:text-zinc-200">
            Page {pageNum} could not be rendered
          </p>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1 max-w-[240px]">
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={() => doRender(true)}
            className="mt-3 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry Page</span>
          </button>
        </div>
      ) : (
        <>
          {/* LAYER 1: CANVAS (PDF rendering) */}
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              filter: canvasFilter,
            }}
            className="relative z-1 block bg-transparent pointer-events-none select-none transition-[filter] duration-200"
          />

          {/* LAYER 2: HIGHLIGHT OVERLAYS (Rendered on top of canvas, below text layer) */}
          <div className="absolute inset-0 pointer-events-none z-2 overflow-hidden">
            {highlights.map((hl) => {
              const colorConfig = PASTEL_COLORS.find((c) => c.id === hl.color) || PASTEL_COLORS[0];
              const isPulsing = pulsingHighlightId === hl.id;
              return (
                <React.Fragment key={hl.id}>
                  {hl.rects && hl.rects.length > 0 ? (
                    hl.rects.map((rect, rIdx) => (
                      <div
                        key={rIdx}
                        className={`absolute rounded-xs vedora-highlight-overlay ${colorConfig.bgClass} ${
                          isPulsing ? 'vedora-highlight-pulse' : ''
                        }`}
                        style={{
                          top: `${rect.top}%`,
                          left: `${rect.left}%`,
                          width: `${rect.width}%`,
                          height: `${rect.height}%`,
                          backgroundColor: colorConfig.hex,
                          opacity: theme === 'dark' ? 0.42 : 0.48,
                          mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
                        }}
                      />
                    ))
                  ) : (
                    <div
                      className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-medium shadow-xs ${colorConfig.bgClass} text-stone-900 border border-black/10`}
                    >
                      “{hl.text.slice(0, 30)}...”
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* LAYER 3: SELECTABLE TEXT LAYER (PDF.js textLayer for text selection and selection handles) */}
          <div
            ref={textLayerRef}
            className="textLayer select-text"
            style={{
              zIndex: 3,
              width: '100%',
              height: '100%',
            }}
          />

          {/* Scanned / Image-based indicator with clear OCR explanation (Requirement 7) */}
          {isScanned && (
            <div className="absolute top-2 right-2 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOcrNotice((prev) => !prev);
                }}
                className="bg-stone-800/85 hover:bg-stone-800 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                title="Click for scanned document information"
              >
                <Info className="w-2.5 h-2.5 text-amber-400" />
                <span>Image-based (OCR required)</span>
              </button>
              {showOcrNotice && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 w-56 p-2.5 bg-stone-900/95 text-white text-[10px] rounded-xl shadow-xl border border-white/20 backdrop-blur-md animate-in fade-in duration-150 leading-relaxed"
                >
                  <p className="font-semibold text-amber-300 mb-0.5">Scanned Image PDF</p>
                  <p className="text-stone-300">
                    This page consists of scanned images without embedded text. Text selection and highlighting require OCR (Optical Character Recognition) processing.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowOcrNotice(false)}
                    className="mt-1.5 text-[9px] font-bold text-teal-300 hover:underline cursor-pointer"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Page Number Pill */}
          <div className="absolute bottom-2 right-2 bg-stone-900/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none z-20 tabular-nums">
            {pageNum} / {totalPages}
          </div>
        </>
      )}
    </div>
  );
};
