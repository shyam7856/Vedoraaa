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
import { Copy, Trash2, X, Edit3, Check, Maximize2 } from 'lucide-react';

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
  documentName,
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
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const noteModalRef = useRef<HTMLDivElement>(null);
  const isInteractingWithToolbarRef = useRef<boolean>(false);
  const activeRangeRef = useRef<Range | null>(null);

  // High-performance smooth pinch zoom & double tap tracking
  const isPinchZoomingRef = useRef<boolean>(false);
  const [isPinchZooming, setIsPinchZooming] = useState<boolean>(false);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(zoomScale);
  const zoomScaleRef = useRef<number>(zoomScale);
  zoomScaleRef.current = zoomScale;
  const currentGestureScaleRef = useRef<number>(zoomScale);
  const pinchFocalPointRef = useRef<{
    focalX: number;
    focalY: number;
    clientX: number;
    clientY: number;
  }>({ focalX: 0, focalY: 0, clientX: 0, clientY: 0 });
  const lastTapInfoRef = useRef<{ time: number; x: number; y: number } | null>(null);

  // Layout metrics
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<number>(1.414);
  const [baseWidth, setBaseWidth] = useState<number>(360);

  // Floating toolbar for new text selection
  const [selectedTextData, setSelectedTextData] = useState<{
    text: string;
    page: number;
    rects: HighlightRect[];
  } | null>(null);

  // Floating toolbar for tapping an existing highlight (Requirement 4)
  const [activeHighlightToolbar, setActiveHighlightToolbar] = useState<HighlightItem | null>(null);

  // Dynamic floating toolbar coordinates
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);

  // Subtle pulse animation state (Requirement 5)
  const [pulsingHighlightId, setPulsingHighlightId] = useState<string | null>(null);
  const triggerPulse = useCallback((id: string) => {
    setPulsingHighlightId(id);
    setTimeout(() => {
      setPulsingHighlightId((curr) => (curr === id ? null : curr));
    }, 450);
  }, []);

  // Note editor modal for highlights (Requirement 4)
  const [editingHighlight, setEditingHighlight] = useState<HighlightItem | null>(null);
  const [editingColor, setEditingColor] = useState<HighlightColor>('yellow');
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  // Initial Page 1 Inspection for accurate aspect ratio
  useEffect(() => {
    let isCancelled = false;
    async function initBaseline() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth || window.innerWidth || 360;
      // Zero horizontal gutter on mobile to use full reading width efficiently
      const horizontalGutter = containerWidth < 640 ? 0 : 16;
      const targetWidth = Math.min(containerWidth - horizontalGutter, 920);
      setBaseWidth(Math.max(280, targetWidth));

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
        const containerWidth = containerRef.current.clientWidth || window.innerWidth || 360;
        const horizontalGutter = containerWidth < 640 ? 0 : 16;
        const targetWidth = Math.min(containerWidth - horizontalGutter, 920);
        setBaseWidth(Math.max(280, targetWidth));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to calculate toolbar position
  const calculatePositionForSelection = useCallback((range: Range): { x: number; y: number } | null => {
    const clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) return null;

    const firstRect = clientRects[0];
    const lastRect = clientRects[clientRects.length - 1];

    const midX = (firstRect.left + lastRect.right) / 2;
    const toolbarWidth = 280;
    const minX = toolbarWidth / 2 + 10;
    const maxX = window.innerWidth - toolbarWidth / 2 - 10;
    const x = Math.min(Math.max(minX, midX), maxX);

    const spaceAbove = firstRect.top;
    let y: number;
    if (spaceAbove >= 68) {
      y = firstRect.top - 54;
    } else {
      y = Math.min(window.innerHeight - 60, lastRect.bottom + 12);
    }

    return { x, y };
  }, []);

  const calculatePositionForHighlight = useCallback((hl: HighlightItem): { x: number; y: number } | null => {
    const pageEl = document.getElementById(`vedora-pdf-page-${hl.page}`);
    if (!pageEl || !hl.rects || hl.rects.length === 0) return null;

    const pageRect = pageEl.getBoundingClientRect();
    const firstRect = hl.rects[0];
    const topPx = pageRect.top + (firstRect.top * pageRect.height) / 100;
    const leftPx = pageRect.left + (firstRect.left * pageRect.width) / 100;
    const widthPx = (firstRect.width * pageRect.width) / 100;

    const midX = leftPx + widthPx / 2;
    const toolbarWidth = 310;
    const minX = toolbarWidth / 2 + 10;
    const maxX = window.innerWidth - toolbarWidth / 2 - 10;
    const x = Math.min(Math.max(minX, midX), maxX);

    let y: number;
    if (topPx >= 68) {
      y = topPx - 54;
    } else {
      y = Math.min(window.innerHeight - 60, topPx + (firstRect.height * pageRect.height) / 100 + 12);
    }

    return { x, y };
  }, []);

  // Update position on scroll / zoom
  const updateToolbarPosition = useCallback(() => {
    if (selectedTextData && activeRangeRef.current) {
      const pos = calculatePositionForSelection(activeRangeRef.current);
      if (pos) setToolbarPosition(pos);
    } else if (activeHighlightToolbar) {
      const pos = calculatePositionForHighlight(activeHighlightToolbar);
      if (pos) setToolbarPosition(pos);
    }
  }, [selectedTextData, activeHighlightToolbar, calculatePositionForSelection, calculatePositionForHighlight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(updateToolbarPosition);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updateToolbarPosition]);

  // Text selection detection (Requirement 1: Long-press & mouse selection)
  const checkSelection = useCallback(() => {
    if (isInteractingWithToolbarRef.current) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      // Only clear if not interacting with existing highlight toolbar
      if (!activeHighlightToolbar) {
        setSelectedTextData(null);
        activeRangeRef.current = null;
        setToolbarPosition(null);
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length === 0) {
      if (!activeHighlightToolbar) {
        setSelectedTextData(null);
        activeRangeRef.current = null;
        setToolbarPosition(null);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as Element)
        : container.parentElement;
    const pageContainer = element?.closest('[data-page-number]') as HTMLDivElement | null;
    if (!pageContainer) {
      setSelectedTextData(null);
      activeRangeRef.current = null;
      setToolbarPosition(null);
      return;
    }

    const pageNumber = parseInt(pageContainer.getAttribute('data-page-number') || '1', 10);
    const pageRect = pageContainer.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) {
      setSelectedTextData(null);
      activeRangeRef.current = null;
      setToolbarPosition(null);
      return;
    }

    const highlightRects: HighlightRect[] = clientRects.map((r) => ({
      top: Math.max(0, ((r.top - pageRect.top) / pageRect.height) * 100),
      left: Math.max(0, ((r.left - pageRect.left) / pageRect.width) * 100),
      width: Math.min(100, (r.width / pageRect.width) * 100),
      height: Math.min(100, (r.height / pageRect.height) * 100),
    }));

    activeRangeRef.current = range;
    setActiveHighlightToolbar(null); // Close highlight toolbar if selecting new text

    const pos = calculatePositionForSelection(range);
    if (pos) {
      setToolbarPosition(pos);
      setSelectedTextData({
        text,
        page: pageNumber,
        rects: highlightRects,
      });
    }
  }, [activeHighlightToolbar, calculatePositionForSelection]);

  useEffect(() => {
    let selectionRaf: number | null = null;
    const handleSelectionChange = () => {
      if (selectionRaf) cancelAnimationFrame(selectionRaf);
      selectionRaf = requestAnimationFrame(checkSelection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    return () => {
      if (selectionRaf) cancelAnimationFrame(selectionRaf);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, [checkSelection]);

  // Global click-outside listener to dismiss toolbar (Requirement 1 & 4)
  useEffect(() => {
    const handleGlobalPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore if clicking inside toolbar or note modal
      if (toolbarRef.current?.contains(target) || noteModalRef.current?.contains(target)) {
        return;
      }

      // Check if tap was on a highlight hit area (handled by onSelectHighlight)
      const isPageItem = target.closest('[data-page-number]');
      if (!isPageItem) {
        // Dismiss toolbar
        setSelectedTextData(null);
        setActiveHighlightToolbar(null);
        setToolbarPosition(null);
        activeRangeRef.current = null;
      }
    };

    document.addEventListener('mousedown', handleGlobalPointerDown);
    document.addEventListener('touchstart', handleGlobalPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleGlobalPointerDown);
      document.removeEventListener('touchstart', handleGlobalPointerDown);
    };
  }, []);

  // 1. HARDWARE-ACCELERATED PINCH-TO-ZOOM & DOUBLE-TAP ZOOM
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onChangeZoom) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Two-finger pinch-to-zoom start
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinchZoomingRef.current = true;
        setIsPinchZooming(true);

        // Immediately dismiss text selection & toolbars so zoom does not trigger highlighting
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          sel.removeAllRanges();
        }
        setSelectedTextData(null);
        setActiveHighlightToolbar(null);
        setToolbarPosition(null);

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartDistRef.current = Math.max(10, dist);
        pinchStartScaleRef.current = zoomScaleRef.current;
        currentGestureScaleRef.current = zoomScaleRef.current;

        const containerRect = container.getBoundingClientRect();
        const midClientX = (t1.clientX + t2.clientX) / 2;
        const midClientY = (t1.clientY + t2.clientY) / 2;
        const focalX = midClientX - containerRect.left + container.scrollLeft;
        const focalY = midClientY - containerRect.top + container.scrollTop;

        pinchFocalPointRef.current = {
          focalX,
          focalY,
          clientX: midClientX,
          clientY: midClientY,
        };

        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transformOrigin = `${focalX}px ${focalY}px`;
          contentWrapperRef.current.style.willChange = 'transform';
          contentWrapperRef.current.style.transition = 'none';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinchZoomingRef.current && pinchStartDistRef.current) {
        // Prevent scrolling while pinch-zooming
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = dist / pinchStartDistRef.current;

        const candidateZoom = Math.min(3.5, Math.max(0.65, pinchStartScaleRef.current * ratio));
        currentGestureScaleRef.current = candidateZoom;

        // Apply hardware-accelerated uniform GPU scale without re-rendering PDF
        if (contentWrapperRef.current) {
          const visualRatio = candidateZoom / pinchStartScaleRef.current;
          contentWrapperRef.current.style.transform = `scale(${visualRatio})`;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // 1. Two-finger gesture finished
      if (isPinchZoomingRef.current && e.touches.length < 2) {
        isPinchZoomingRef.current = false;
        setIsPinchZooming(false);
        pinchStartDistRef.current = null;

        // Clear temporary GPU transform
        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transform = '';
          contentWrapperRef.current.style.transformOrigin = '';
          contentWrapperRef.current.style.willChange = '';
          contentWrapperRef.current.style.transition = '';
        }

        const finalScale = Math.min(3.5, Math.max(0.65, parseFloat(currentGestureScaleRef.current.toFixed(2))));

        if (Math.abs(finalScale - zoomScaleRef.current) > 0.03) {
          onChangeZoom(finalScale);

          // Preserve focal reading position
          requestAnimationFrame(() => {
            const curContainer = containerRef.current;
            if (curContainer && pinchFocalPointRef.current) {
              const oldScale = pinchStartScaleRef.current;
              const multiplier = finalScale / oldScale;
              const curRect = curContainer.getBoundingClientRect();
              const newScrollX =
                pinchFocalPointRef.current.focalX * multiplier -
                (pinchFocalPointRef.current.clientX - curRect.left);
              const newScrollY =
                pinchFocalPointRef.current.focalY * multiplier -
                (pinchFocalPointRef.current.clientY - curRect.top);
              curContainer.scrollLeft = Math.max(0, newScrollX);
              curContainer.scrollTop = Math.max(0, newScrollY);
            }
          });
        }
        return;
      }

      // 2. Double-tap detection
      if (!isPinchZoomingRef.current && e.touches.length === 0 && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];

        // Do not trigger double-tap if text was selected or floating toolbar is up
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
        if (selectedTextData || activeHighlightToolbar) return;

        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.closest('button') ||
            target.closest('a') ||
            target.closest('.vedora-highlight-overlay') ||
            target.closest('[role="button"]'))
        ) {
          return;
        }

        const now = Date.now();
        const last = lastTapInfoRef.current;

        if (last && now - last.time < 300) {
          const dist = Math.hypot(touch.clientX - last.x, touch.clientY - last.y);
          if (dist < 32) {
            e.preventDefault();
            lastTapInfoRef.current = null;

            if (zoomScaleRef.current <= 1.05) {
              // Smooth zoom in to 1.85 reading magnification, centered on tap
              const targetScale = 1.85;
              const containerRect = container.getBoundingClientRect();
              const tapX = touch.clientX - containerRect.left + container.scrollLeft;
              const tapY = touch.clientY - containerRect.top + container.scrollTop;

              onChangeZoom(targetScale);

              setTimeout(() => {
                const cur = containerRef.current;
                if (!cur) return;
                const ratio = targetScale / zoomScaleRef.current;
                const targetScrollX = tapX * ratio - containerRect.width / 2;
                const targetScrollY = tapY * ratio - containerRect.height / 2;
                cur.scrollTo({
                  left: Math.max(0, targetScrollX),
                  top: Math.max(0, targetScrollY),
                  behavior: 'smooth',
                });
              }, 40);
            } else {
              // Return to fit-to-page (1.0)
              onChangeZoom(1.0);
              setTimeout(() => {
                containerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
              }, 40);
            }
            return;
          }
        }

        lastTapInfoRef.current = { time: now, x: touch.clientX, y: touch.clientY };
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onChangeZoom, selectedTextData, activeHighlightToolbar]);

  // Requirement 3: Apply and Save Highlight on new selection
  const handleSaveHighlight = (color: HighlightColor) => {
    if (!selectedTextData) return;
    const colorConfig = PASTEL_COLORS.find((c) => c.id === color) || PASTEL_COLORS[0];

    // Prevent duplicate highlight on the same page with identical text
    const existingIndex = highlights.findIndex(
      (h) => h.page === selectedTextData.page && h.text.trim() === selectedTextData.text.trim()
    );

    let highlightId: string;
    if (existingIndex >= 0) {
      const existing = highlights[existingIndex];
      highlightId = existing.id;
      const updated: HighlightItem = {
        ...existing,
        color,
        colorHex: colorConfig.hex,
        rects: selectedTextData.rects,
      };
      onUpdateHighlight?.(updated);
      onShowToast(`Updated highlight on Page ${selectedTextData.page}`);
    } else {
      highlightId = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newHighlight: HighlightItem = {
        id: highlightId,
        documentId,
        text: selectedTextData.text,
        color,
        colorHex: colorConfig.hex,
        page: selectedTextData.page,
        rects: selectedTextData.rects,
        createdAt: Date.now(),
      };
      onAddHighlight(newHighlight);
      onShowToast(`Highlighted on Page ${selectedTextData.page}`);
    }

    triggerPulse(highlightId);
    isInteractingWithToolbarRef.current = false;
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
    setToolbarPosition(null);
    activeRangeRef.current = null;
  };

  // Requirement 4: Tap existing highlight to open contextual toolbar
  const handleSelectExistingHighlight = (
    hl: HighlightItem,
    clickInfo?: { clientX: number; clientY: number }
  ) => {
    // Clear any text selection
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
    activeRangeRef.current = null;

    triggerPulse(hl.id);
    setActiveHighlightToolbar(hl);

    if (clickInfo) {
      const toolbarWidth = 310;
      const minX = toolbarWidth / 2 + 10;
      const maxX = window.innerWidth - toolbarWidth / 2 - 10;
      const x = Math.min(Math.max(minX, clickInfo.clientX), maxX);
      let y = clickInfo.clientY - 54;
      if (clickInfo.clientY < 68) {
        y = clickInfo.clientY + 20;
      }
      setToolbarPosition({ x, y });
    } else {
      const pos = calculatePositionForHighlight(hl);
      if (pos) setToolbarPosition(pos);
    }
  };

  // Requirement 4: Change color of existing highlight immediately
  const handleUpdateHighlightColor = (hl: HighlightItem, newColor: HighlightColor) => {
    const colorConfig = PASTEL_COLORS.find((c) => c.id === newColor) || PASTEL_COLORS[0];
    const updated: HighlightItem = {
      ...hl,
      color: newColor,
      colorHex: colorConfig.hex,
    };
    onUpdateHighlight?.(updated);
    setActiveHighlightToolbar(updated);
    triggerPulse(hl.id);
    onShowToast(`Changed color to ${colorConfig.name}`);
  };

  // Copy action
  const handleCopy = () => {
    const textToCopy = activeHighlightToolbar
      ? activeHighlightToolbar.text
      : selectedTextData?.text;
    if (!textToCopy) return;

    navigator.clipboard?.writeText(textToCopy);
    onShowToast('Text copied to clipboard');

    if (selectedTextData) {
      window.getSelection()?.removeAllRanges();
      setSelectedTextData(null);
      setToolbarPosition(null);
      activeRangeRef.current = null;
    }
  };

  // Delete action (Requirement 4)
  const handleDelete = (highlightId: string) => {
    onDeleteHighlight(highlightId);
    onShowToast('Highlight deleted');
    setActiveHighlightToolbar(null);
    setToolbarPosition(null);
    if (editingHighlight?.id === highlightId) {
      setEditingHighlight(null);
    }
  };

  // Open note editor (Requirement 4)
  const handleOpenEditNote = () => {
    if (activeHighlightToolbar) {
      setEditingHighlight(activeHighlightToolbar);
      setEditingColor(activeHighlightToolbar.color);
      setEditingNoteText(activeHighlightToolbar.note || '');
    } else if (selectedTextData) {
      // First save highlight, then open editor
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
      triggerPulse(newHighlight.id);

      window.getSelection()?.removeAllRanges();
      setSelectedTextData(null);
      setToolbarPosition(null);
      activeRangeRef.current = null;

      setEditingHighlight(newHighlight);
      setEditingColor('yellow');
      setEditingNoteText('');
    }
  };

  const handleSaveNoteModal = () => {
    if (!editingHighlight) return;
    const colorConfig = PASTEL_COLORS.find((c) => c.id === editingColor) || PASTEL_COLORS[0];
    const updated: HighlightItem = {
      ...editingHighlight,
      color: editingColor,
      colorHex: colorConfig.hex,
      note: editingNoteText.trim() || undefined,
    };
    onUpdateHighlight?.(updated);
    triggerPulse(updated.id);
    onShowToast(editingNoteText.trim() ? 'Note saved' : 'Highlight updated');
    setEditingHighlight(null);
    setActiveHighlightToolbar(null);
    setToolbarPosition(null);
  };

  const handleDismissToolbar = () => {
    isInteractingWithToolbarRef.current = false;
    window.getSelection()?.removeAllRanges();
    setSelectedTextData(null);
    setActiveHighlightToolbar(null);
    setToolbarPosition(null);
    activeRangeRef.current = null;
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
      className={`flex-1 w-full overflow-auto p-0 relative transition-colors duration-200 select-text ${containerBgClass}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: isPinchZooming ? 'none' : 'pan-x pan-y pinch-zoom',
      }}
    >
      {/* FLOATING CONTEXTUAL TOOLBAR (Requirement 1, 2, 4) */}
      {(selectedTextData || activeHighlightToolbar) && toolbarPosition && (
        <div
          ref={toolbarRef}
          onMouseDown={(e) => {
            e.preventDefault();
            isInteractingWithToolbarRef.current = true;
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            isInteractingWithToolbarRef.current = true;
          }}
          className="fixed z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-xl border backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
            transform: 'translateX(-50%)',
            backgroundColor: theme === 'dark' ? '#242426' : '#FAF6EE',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#E4DDD2',
            color: theme === 'dark' ? '#F2F0E8' : '#2C2824',
            boxShadow:
              theme === 'dark'
                ? '0 10px 30px -5px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)'
                : '0 10px 30px -5px rgba(60,45,25,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* 5 Exact Highlight Colour Palette Swatches in exact order (Requirement 2) */}
          <div className="flex items-center gap-2 pr-1.5">
            {PASTEL_COLORS.map((c) => {
              const isSelected = activeHighlightToolbar
                ? activeHighlightToolbar.color === c.id
                : false;
              return (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (activeHighlightToolbar) {
                      handleUpdateHighlightColor(activeHighlightToolbar, c.id);
                    } else if (selectedTextData) {
                      handleSaveHighlight(c.id);
                    }
                  }}
                  className={`w-[26px] h-[26px] rounded-full transition-transform flex items-center justify-center cursor-pointer shadow-xs active:scale-90 hover:scale-110 relative ${
                    isSelected
                      ? 'ring-2 ring-stone-900 dark:ring-white scale-105'
                      : 'border border-black/15 hover:border-black/30'
                  }`}
                  style={{
                    backgroundColor: c.hex,
                  }}
                  title={c.name}
                  aria-label={`Highlight with ${c.name}`}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-stone-900 stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Thin divider */}
          <div
            className="w-px h-5 mx-0.5"
            style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : '#DFD7C9' }}
          />

          {/* Copy Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopy}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
            style={{ color: theme === 'dark' ? '#EDE6D8' : '#302C26' }}
            title="Copy text"
            aria-label="Copy text"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Edit / Note Action (Requirement 4) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleOpenEditNote}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
            style={{ color: theme === 'dark' ? '#EDE6D8' : '#302C26' }}
            title="Add or edit note"
            aria-label="Add or edit note"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-[11px] font-medium pr-0.5">Note</span>
          </button>

          {/* Delete Action: Shown when tapping an existing highlight (Requirement 4) */}
          {activeHighlightToolbar && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleDelete(activeHighlightToolbar.id)}
              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Delete highlight"
              aria-label="Delete highlight"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Dismiss Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleDismissToolbar}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer opacity-70 hover:opacity-100"
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HIGHLIGHT & NOTE EDITOR MODAL (Requirement 4) */}
      {editingHighlight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
          onClick={() => setEditingHighlight(null)}
        >
          <div
            ref={noteModalRef}
            className="bg-[#FAF8F5] dark:bg-zinc-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-zinc-800 space-y-3.5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-[#154D43] dark:text-teal-400 uppercase tracking-wider">
                Highlight Note • Page {editingHighlight.page}
              </span>
              <button
                type="button"
                onClick={() => setEditingHighlight(null)}
                className="w-7 h-7 rounded-full bg-stone-200/60 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quoted text preview with selected color */}
            <div
              className="p-3 rounded-2xl text-xs text-stone-800 dark:text-zinc-200 leading-relaxed max-h-32 overflow-y-auto border border-black/5"
              style={{
                backgroundColor: `${
                  (PASTEL_COLORS.find((c) => c.id === editingColor) || PASTEL_COLORS[0]).hex
                }55`,
              }}
            >
              “{editingHighlight.text}”
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
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-xs cursor-pointer ${
                      editingColor === c.id
                        ? 'scale-115 ring-2 ring-[#154D43] dark:ring-teal-400'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {editingColor === c.id && (
                      <Check className="w-3.5 h-3.5 text-stone-900 stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Attached Note / Annotation Textarea */}
            <div>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                Attached Note / Annotation
              </span>
              <textarea
                value={editingNoteText}
                onChange={(e) => setEditingNoteText(e.target.value)}
                placeholder="Add your reflections, thoughts, or summary on this passage..."
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#154D43]/20 resize-none h-20"
              />
            </div>

            {/* Actions: Delete, Copy, Save */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const fullText = editingNoteText
                      ? `"${editingHighlight.text}"\n\nNote: ${editingNoteText}`
                      : editingHighlight.text;
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
                  onClick={() => handleDelete(editingHighlight.id)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer"
                  title="Delete highlight"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveNoteModal}
                className="px-4 py-1.5 bg-[#154D43] hover:bg-[#0E3A32] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTENTIONAL RESET ZOOM BUTTON */}
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

      {/* PDF VIEWER: SINGLE PAGE OR CONTINUOUS SCROLL (Uniform GPU scaling via contentWrapperRef) */}
      <div
        ref={contentWrapperRef}
        className="w-full flex flex-col items-center select-text"
      >
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
            onSelectHighlight={handleSelectExistingHighlight}
            pulsingHighlightId={pulsingHighlightId}
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
            onSelectHighlight={handleSelectExistingHighlight}
            pulsingHighlightId={pulsingHighlightId}
            activeSearchMatch={activeSearchMatch}
            scrollToPageTarget={scrollToPageTarget}
            onScrollTargetCompleted={onScrollTargetCompleted}
            scrollContainerRef={containerRef}
          />
        )}
      </div>
    </div>
  );
};
