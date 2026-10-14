import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { AlertCircle, RotateCw, Info, Search, Loader2 } from 'lucide-react';
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
  onSelectHighlight: (hl: HighlightItem) => void;
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
          // Render cancelled before atomic swap; do not mark rendered so it can re-render fresh
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

  return (
    <div
      id={`vedora-pdf-page-${pageNum}`}
      data-page-number={pageNum}
      ref={(el) => {
        containerRef.current = el;
        pageContainerRef?.(el);
      }}
      className={`relative mb-5 sm:mb-6 rounded-xl mx-auto border transition-all duration-200 select-text ${
        theme === 'dark'
          ? 'border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.45)]'
          : theme === 'sepia'
          ? 'border-[#927B5C]/20 shadow-[0_2px_14px_rgba(58,48,38,0.08)]'
          : 'border-black/[0.08] shadow-[0_2px_14px_rgba(40,30,20,0.06)]'
      } ${className}`}
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

      {/* Elegant loading placeholder before first render */}
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
          {/* LAYER 1: SAVED PASTEL HIGHLIGHTS */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-xl">
            {highlights.map((hl) => {
              const colorConfig = PASTEL_COLORS.find((c) => c.id === hl.color) || PASTEL_COLORS[0];
              return (
                <React.Fragment key={hl.id}>
                  {hl.rects && hl.rects.length > 0 ? (
                    hl.rects.map((rect, rIdx) => (
                      <div
                        key={rIdx}
                        className={`absolute rounded-xs ${colorConfig.bgClass}`}
                        style={{
                          top: `${rect.top}%`,
                          left: `${rect.left}%`,
                          width: `${rect.width}%`,
                          height: `${rect.height}%`,
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

          {/* LAYER 2: CANVAS */}
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              filter: canvasFilter,
            }}
            className="relative z-1 block bg-transparent pointer-events-none select-none rounded-xl transition-[filter] duration-200"
          />

          {/* LAYER 3: SELECTABLE TEXT LAYER */}
          <div
            ref={textLayerRef}
            className="textLayer select-text rounded-xl"
            style={{
              zIndex: 3,
              width: '100%',
              height: '100%',
            }}
          />

          {/* LAYER 4: INTERACTIVE HIGHLIGHT HIT AREAS */}
          <div className="absolute inset-0 pointer-events-none z-3 overflow-hidden">
            {highlights.map((hl) => (
              <React.Fragment key={`hit_${hl.id}`}>
                {hl.rects && hl.rects.length > 0 ? (
                  hl.rects.map((rect, rIdx) => (
                    <div
                      key={rIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        const sel = window.getSelection();
                        if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
                          onSelectHighlight(hl);
                        }
                      }}
                      className="absolute rounded-xs pointer-events-auto cursor-pointer bg-transparent"
                      style={{
                        top: `${rect.top}%`,
                        left: `${rect.left}%`,
                        width: `${rect.width}%`,
                        height: `${rect.height}%`,
                      }}
                      title={`Highlight: "${hl.text.slice(0, 40)}..." (Click to manage)`}
                    />
                  ))
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHighlight(hl);
                    }}
                    className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-medium pointer-events-auto cursor-pointer bg-transparent"
                    style={{ width: '120px', height: '24px' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Scanned / Image-based indicator */}
          {isScanned && (
            <div className="absolute top-2 right-2 bg-stone-800/80 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-full pointer-events-none z-20 flex items-center gap-1 shadow-xs">
              <Info className="w-2.5 h-2.5" />
              <span>Image-based page</span>
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
