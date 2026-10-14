import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  HighlightItem,
  HighlightColor,
  HighlightRect,
  ReaderTheme,
  ReaderViewMode,
  PASTEL_COLORS,
} from '../types';
import { SearchMatchItem } from './reader/SearchToolbar';
import { ContinuousLayout } from './reader/ContinuousLayout';
import { SinglePageLayout } from './reader/SinglePageLayout';
import { Copy, Trash2, X, Edit3 } from 'lucide-react';

export interface ContinuousPdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  documentId: string;
  documentName: string;
  totalPages: number;
  initialPage: number;
  currentPage?: number;
  zoomScale: number;
  rotation?: number;
  theme?: ReaderTheme;
  viewMode?: ReaderViewMode;
  onPageChange: (newPage: number) => void;
  highlights: HighlightItem[];
  onAddHighlight: (highlight: HighlightItem) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onShowToast: (message: string) => void;
  scrollToPageTarget?: number | null;
  onScrollTargetCompleted?: () => void;
  onOpenNoteWithSelection?: (selectedText: string, page: number) => void;
  activeSearchMatch?: SearchMatchItem | null;
}

export const ContinuousPdfViewer: React.FC<ContinuousPdfViewerProps> = ({
  pdfDoc,
  documentId,
  documentName: _documentName,
  totalPages,
  initialPage: _initialPage,
  currentPage = 1,
  zoomScale,
  rotation = 0,
  theme = 'light',
  viewMode = 'continuous',
  onPageChange,
  highlights,
  onAddHighlight,
  onDeleteHighlight,
  onShowToast,
  scrollToPageTarget,
  onScrollTargetCompleted,
  onOpenNoteWithSelection,
  activeSearchMatch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractingWithToolbarRef = useRef<boolean>(false);

  // Layout metrics
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<number>(1.414);
  const [baseWidth, setBaseWidth] = useState<number>(360);

  // Floating toolbar for text selection
  const [selectedTextData, setSelectedTextData] = useState<{
    text: string;
    page: number;
    rects: HighlightRect[];
    toolbarX: number;
    toolbarY: number;
  } | null>(null);

  const [selectedHighlightInfo, setSelectedHighlightInfo] = useState<HighlightItem | null>(null);

  // Initial Page 1 Inspection for accurate aspect ratio
  useEffect(() => {
    let isCancelled = false;
    async function initBaseline() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth || 360;
      const horizontalPadding = containerWidth < 640 ? 32 : 56;
      const targetWidth = Math.min(containerWidth - horizontalPadding, 680);
      setBaseWidth(Math.max(260, targetWidth));

      try {
        const page1 = await pdfDoc.getPage(1);
        const intrinsic = typeof page1.rotate === 'number' ? page1.rotate : 0;
        const finalRotation = ((intrinsic + (rotation || 0)) % 360 + 360) % 360;
        const vp1 = page1.getViewport({ scale: 1.0, rotation: finalRotation });
        if (!isCancelled && vp1.width > 0 && vp1.height > 0) {
          setDefaultAspectRatio(vp1.height / vp1.width);
        }
      } catch (err) {
        console.warn('Could not inspect page 1 dimensions:', err);
      }
    }

    initBaseline();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, rotation]);

  // Recalculate container width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth || 360;
        const horizontalPadding = containerWidth < 640 ? 32 : 56;
        const targetWidth = Math.min(containerWidth - horizontalPadding, 680);
        setBaseWidth(Math.max(260, targetWidth));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Text selection detection
  const checkSelection = useCallback(() => {
    if (isInteractingWithToolbarRef.current) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setSelectedTextData(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length === 0) {
      setSelectedTextData(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement;
    const pageContainer = element?.closest('[data-page-number]') as HTMLDivElement | null;
    if (!pageContainer) {
      setSelectedTextData(null);
      return;
    }

    const pageNumber = parseInt(pageContainer.getAttribute('data-page-number') || '1', 10);
    const pageRect = pageContainer.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) {
      setSelectedTextData(null);
      return;
    }

    const highlightRects: HighlightRect[] = clientRects.map((r) => ({
      top: Math.max(0, ((r.top - pageRect.top) / pageRect.height) * 100),
      left: Math.max(0, ((r.left - pageRect.left) / pageRect.width) * 100),
      width: Math.min(100, (r.width / pageRect.width) * 100),
      height: Math.min(100, (r.height / pageRect.height) * 100),
    }));

    const firstRect = clientRects[0];
    const lastRect = clientRects[clientRects.length - 1];

    const selectionMidX = (firstRect.left + lastRect.right) / 2;
    const toolbarWidth = 265;
    const minX = toolbarWidth / 2 + 12;
    const maxX = window.innerWidth - toolbarWidth / 2 - 12;
    const toolbarX = Math.min(Math.max(minX, selectionMidX), maxX);

    const spaceBelow = window.innerHeight - lastRect.bottom;
    const spaceAbove = firstRect.top;
    let toolbarY: number;

    if (spaceBelow >= 62) {
      toolbarY = lastRect.bottom + 12;
    } else if (spaceAbove >= 60) {
      toolbarY = Math.max(56, firstRect.top - 52);
    } else {
      toolbarY = Math.max(56, Math.min(window.innerHeight - 60, lastRect.bottom + 8));
    }

    setSelectedTextData({
      text,
      page: pageNumber,
      rects: highlightRects,
      toolbarX,
      toolbarY,
    });
  }, []);

  useEffect(() => {
    let selectionRaf: number | null = null;
    const handleSelectionChange = () => {
      if (selectionRaf) {
        cancelAnimationFrame(selectionRaf);
      }
      selectionRaf = requestAnimationFrame(checkSelection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      if (selectionRaf) {
        cancelAnimationFrame(selectionRaf);
      }
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [checkSelection]);

  const handleSaveHighlight = (color: HighlightColor) => {
    if (!selectedTextData) return;
    const colorConfig = PASTEL_COLORS.find((c) => c.id === color) || PASTEL_COLORS[0];
    const newHighlight: HighlightItem = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      documentId,
      text: selectedTextData.text,
      color,
      colorHex: colorConfig.hex,
      page: selectedTextData.page,
      rects: selectedTextData.rects,
      createdAt: Date.now(),
    };

    onAddHighlight(newHighlight);
    onShowToast(`Saved highlight on Page ${selectedTextData.page}`);
    isInteractingWithToolbarRef.current = false;
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
  };

  const handleCopySelectedText = () => {
    if (!selectedTextData) return;
    navigator.clipboard?.writeText(selectedTextData.text);
    onShowToast('Text copied to clipboard');
    isInteractingWithToolbarRef.current = false;
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
  };

  const pageWidth = Math.floor(baseWidth * zoomScale);
  const containerBgClass =
    theme === 'dark'
      ? 'bg-[#1F1F1D] text-[#E8E0D3]'
      : theme === 'sepia'
      ? 'bg-[#F4EDE4] text-[#3A3026]'
      : 'bg-[#F5F0E6] text-[#302C26]';

  return (
    <div
      ref={containerRef}
      className={`flex-1 w-full overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 relative transition-colors duration-200 ${containerBgClass}`}
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* FLOATING TEXT SELECTION TOOLBAR */}
      {selectedTextData && (
        <div
          onMouseDown={() => {
            isInteractingWithToolbarRef.current = true;
          }}
          className="fixed z-50 flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/95 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none"
          style={{
            left: `${selectedTextData.toolbarX}px`,
            top: `${selectedTextData.toolbarY}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* 5 Pastel Color Dots */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/20">
            {PASTEL_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSaveHighlight(c.id)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-125 active:scale-95 shadow-2xs border border-white/40 cursor-pointer"
                style={{ backgroundColor: c.hex }}
                title={`Highlight with ${c.name}`}
              />
            ))}
          </div>

          {/* Copy Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopySelectedText}
            className="p-1 rounded-lg hover:bg-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Copy text"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Note Action: Attach selection to Note Drawer */}
          {onOpenNoteWithSelection && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (selectedTextData) {
                  onOpenNoteWithSelection(selectedTextData.text, selectedTextData.page);
                  isInteractingWithToolbarRef.current = false;
                  window.getSelection()?.removeAllRanges();
                  setSelectedTextData(null);
                }
              }}
              className="p-1 rounded-lg hover:bg-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Add note to selection"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dismiss Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              isInteractingWithToolbarRef.current = false;
              window.getSelection()?.removeAllRanges();
              setSelectedTextData(null);
            }}
            className="p-1 rounded-lg hover:bg-white/15 text-stone-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* HIGHLIGHT DETAILS / DELETE MODAL */}
      {selectedHighlightInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedHighlightInfo(null)}
        >
          <div
            className="bg-[#FAF8F5] dark:bg-zinc-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-[#154D43] dark:text-teal-400 uppercase tracking-wider">
                Page {selectedHighlightInfo.page} Highlight
              </span>
              <button
                type="button"
                onClick={() => setSelectedHighlightInfo(null)}
                className="w-7 h-7 rounded-full bg-stone-200/60 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div
              className="mt-3 p-3 rounded-xl text-xs text-stone-800 dark:text-zinc-200 leading-relaxed max-h-36 overflow-y-auto"
              style={{ backgroundColor: `${selectedHighlightInfo.colorHex}55` }}
            >
              “{selectedHighlightInfo.text}”
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(selectedHighlightInfo.text);
                  onShowToast('Highlight copied');
                  setSelectedHighlightInfo(null);
                }}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium text-stone-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteHighlight(selectedHighlightInfo.id);
                  onShowToast('Deleted highlight');
                  setSelectedHighlightInfo(null);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORIGINAL PDF VIEW: CONTINUOUS SCROLL OR SINGLE PAGE */}
      {viewMode === 'single' ? (
        <SinglePageLayout
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          targetWidth={pageWidth}
          aspectRatio={defaultAspectRatio}
          zoomScale={zoomScale}
          rotation={rotation}
          theme={theme}
          highlights={highlights}
          onSelectHighlight={setSelectedHighlightInfo}
          activeSearchMatch={activeSearchMatch}
          scrollToPageTarget={scrollToPageTarget}
          onScrollTargetCompleted={onScrollTargetCompleted}
        />
      ) : (
        <ContinuousLayout
          pdfDoc={pdfDoc}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={onPageChange}
          targetWidth={pageWidth}
          aspectRatio={defaultAspectRatio}
          zoomScale={zoomScale}
          rotation={rotation}
          theme={theme}
          highlights={highlights}
          onSelectHighlight={setSelectedHighlightInfo}
          activeSearchMatch={activeSearchMatch}
          scrollToPageTarget={scrollToPageTarget}
          onScrollTargetCompleted={onScrollTargetCompleted}
          scrollContainerRef={containerRef}
        />
      )}
    </div>
  );
};
