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
import { Copy, Trash2, X, Edit3, Check, Maximize2, Sliders } from 'lucide-react';

export interface ContinuousPdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  documentId: string;
  documentName: string;
  totalPages: number;
  initialPage: number;
  currentPage?: number;
  zoomScale: number;
  onChangeZoom?: (newZoom: number) => void;
  rotation?: number;
  theme?: ReaderTheme;
  viewMode?: ReaderViewMode;
  onPageChange: (newPage: number) => void;
  highlights: HighlightItem[];
  onAddHighlight: (highlight: HighlightItem) => void;
  onUpdateHighlight?: (highlight: HighlightItem) => void;
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
  onChangeZoom,
  rotation = 0,
  theme = 'light',
  viewMode = 'continuous',
  onPageChange,
  highlights,
  onAddHighlight,
  onUpdateHighlight,
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

  // Highlight Details / Edit Modal
  const [selectedHighlightInfo, setSelectedHighlightInfo] = useState<HighlightItem | null>(null);
  const [editingColor, setEditingColor] = useState<HighlightColor>('yellow');
  const [editingNoteText, setEditingNoteText] = useState<string>('');

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

  // 1. PINCH-TO-ZOOM GESTURE IMPLEMENTATION
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(zoomScale);
  const pinchMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const zoomScaleRef = useRef<number>(zoomScale);
  zoomScaleRef.current = zoomScale;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onChangeZoom) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartDistanceRef.current = dist;
        pinchStartScaleRef.current = zoomScaleRef.current;
        pinchMidpointRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistanceRef.current !== null) {
        // Prevent default Android scrolling & zooming jump
        e.preventDefault();

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = dist / pinchStartDistanceRef.current;
        const targetScale = Math.min(3.0, Math.max(0.6, pinchStartScaleRef.current * ratio));
        const roundedScale = parseFloat(targetScale.toFixed(2));

        if (Math.abs(roundedScale - zoomScaleRef.current) >= 0.03) {
          // Adjust scroll position to keep midpoint stationary
          if (pinchMidpointRef.current) {
            const rect = container.getBoundingClientRect();
            const relY = pinchMidpointRef.current.y - rect.top;
            const relX = pinchMidpointRef.current.x - rect.left;
            const scaleFactor = roundedScale / zoomScaleRef.current;
            container.scrollTop = (container.scrollTop + relY) * scaleFactor - relY;
            container.scrollLeft = (container.scrollLeft + relX) * scaleFactor - relX;
          }
          onChangeZoom(roundedScale);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDistanceRef.current = null;
        pinchMidpointRef.current = null;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onChangeZoom]);

  // Sync edit modal state when highlight clicked
  const handleOpenHighlightDetails = (hl: HighlightItem) => {
    setSelectedHighlightInfo(hl);
    setEditingColor(hl.color);
    setEditingNoteText(hl.note || '');
  };

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
    const toolbarWidth = 270;
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

  const handleHighlightAndEdit = () => {
    if (!selectedTextData) return;
    const color: HighlightColor = 'yellow';
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
    isInteractingWithToolbarRef.current = false;
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
    handleOpenHighlightDetails(newHighlight);
  };

  const handleCopySelectedText = () => {
    if (!selectedTextData) return;
    navigator.clipboard?.writeText(selectedTextData.text);
    onShowToast('Text copied to clipboard');
    isInteractingWithToolbarRef.current = false;
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
  };

  const handleSaveEditedHighlight = () => {
    if (!selectedHighlightInfo) return;
    const colorCfg = PASTEL_COLORS.find((c) => c.id === editingColor) || PASTEL_COLORS[0];
    const updated: HighlightItem = {
      ...selectedHighlightInfo,
      color: editingColor,
      colorHex: colorCfg.hex,
      note: editingNoteText.trim() || undefined,
    };

    onUpdateHighlight?.(updated);
    onShowToast('Highlight updated');
    setSelectedHighlightInfo(null);
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
        touchAction: 'pan-x pan-y pinch-zoom',
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
              className="p-1 rounded-lg hover:bg-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              title="Add note / annotation to selection"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="text-[10px] pr-0.5">Note</span>
            </button>
          )}

          {/* Edit Action: Highlight & customize color / note immediately */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleHighlightAndEdit}
            className="p-1 rounded-lg hover:bg-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            title="Highlight and Edit"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[10px] pr-0.5 font-medium">Edit</span>
          </button>

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

      {/* HIGHLIGHT DETAILS & EDIT MODAL (Requirement 2) */}
      {selectedHighlightInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedHighlightInfo(null)}
        >
          <div
            className="bg-[#FAF8F5] dark:bg-zinc-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-zinc-800 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-[#154D43] dark:text-teal-400 uppercase tracking-wider">
                Highlight • Page {selectedHighlightInfo.page}
              </span>
              <button
                type="button"
                onClick={() => setSelectedHighlightInfo(null)}
                className="w-7 h-7 rounded-full bg-stone-200/60 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Highlighted text preview */}
            <div
              className="p-3 rounded-2xl text-xs text-stone-800 dark:text-zinc-200 leading-relaxed max-h-32 overflow-y-auto border border-black/5"
              style={{
                backgroundColor: `${
                  (PASTEL_COLORS.find((c) => c.id === editingColor) || PASTEL_COLORS[0]).hex
                }55`,
              }}
            >
              “{selectedHighlightInfo.text}”
            </div>

            {/* Change Highlight Color */}
            <div>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                Highlight Color
              </span>
              <div className="flex items-center gap-2">
                {PASTEL_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditingColor(c.id)}
                    className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center shadow-xs cursor-pointer ${
                      editingColor === c.id ? 'scale-120 ring-2 ring-[#154D43] dark:ring-teal-400' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {editingColor === c.id && <Check className="w-3 h-3 text-stone-800 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Attached Note / Annotation */}
            <div>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                Attached Note / Annotation
              </span>
              <textarea
                value={editingNoteText}
                onChange={(e) => setEditingNoteText(e.target.value)}
                placeholder="Add your reflections, summary, or thoughts on this passage..."
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#154D43]/20 resize-none h-18"
              />
            </div>

            {/* Actions: Save Changes, Copy, Delete */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const fullText = editingNoteText
                      ? `"${selectedHighlightInfo.text}"\n\nNote: ${editingNoteText}`
                      : selectedHighlightInfo.text;
                    navigator.clipboard?.writeText(fullText);
                    onShowToast('Copied to clipboard');
                  }}
                  className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium text-stone-800 dark:text-zinc-200 flex items-center gap-1 cursor-pointer"
                  title="Copy highlight and note"
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
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer"
                  title="Delete highlight"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveEditedHighlight}
                className="px-4 py-1.5 bg-[#154D43] hover:bg-[#0E3A32] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTENTIONAL RESET ZOOM BUTTON (Requirement 1) */}
      {Math.abs(zoomScale - 1.0) > 0.05 && onChangeZoom && (
        <button
          type="button"
          onClick={() => onChangeZoom(1.0)}
          className="fixed bottom-24 right-4 z-40 px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-[11px] font-medium shadow-xl backdrop-blur-md border border-white/20 flex items-center gap-1.5 hover:bg-stone-800 transition-all cursor-pointer animate-in fade-in zoom-in-95"
          title="Reset Zoom to 100%"
        >
          <Maximize2 className="w-3 h-3 text-teal-400" />
          <span>Fit Width ({Math.round(zoomScale * 100)}%)</span>
        </button>
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
          onSelectHighlight={handleOpenHighlightDetails}
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
          onSelectHighlight={handleOpenHighlightDetails}
          activeSearchMatch={activeSearchMatch}
          scrollToPageTarget={scrollToPageTarget}
          onScrollTargetCompleted={onScrollTargetCompleted}
          scrollContainerRef={containerRef}
        />
      )}
    </div>
  );
};
