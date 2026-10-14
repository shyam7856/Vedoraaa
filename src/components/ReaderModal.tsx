import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  Bookmark,
  MoreVertical,
  List,
  Sliders,
  Type,
  Edit3,
  AlertCircle,
  ScrollText,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Book,
  HighlightItem,
  NoteItem,
  ReaderTheme,
  ReaderViewMode,
} from '../types';
import {
  getPdfBlob,
  loadDocHighlights,
  saveDocHighlights,
  loadDocNotes,
  saveDocNotes,
  loadDocBookmarkedPages,
  toggleDocPageBookmark,
} from '../utils/libraryDb';
import { loadPdfDocument } from '../utils/pdfRenderer';
import { ContinuousPdfViewer } from './ContinuousPdfViewer';
import { ContentsDrawer } from './reader/ContentsDrawer';
import { ProgressDrawer } from './reader/ProgressDrawer';
import { AppearanceDrawer } from './reader/AppearanceDrawer';
import { NoteDrawer } from './reader/NoteDrawer';
import { MoreDrawer } from './reader/MoreDrawer';
import { SearchToolbar, SearchMatchItem } from './reader/SearchToolbar';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface ReaderModalProps {
  book: Book;
  onClose: () => void;
  onUpdateProgress?: (bookId: string, progress: number, currentPage?: number) => void;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({
  book,
  onClose,
  onUpdateProgress,
}) => {
  // Page & progress state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return book.currentPage && book.currentPage > 0 ? book.currentPage : 1;
  });
  const [totalPages, setTotalPages] = useState<number>(() => {
    return book.totalPages && book.totalPages > 0 ? book.totalPages : 1;
  });
  const [progress, setProgress] = useState<number>(book.progress || 0);
  const [scrollToPageTarget, setScrollToPageTarget] = useState<number | null>(null);

  // Per-document bookmarks, notes, and highlights
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>(() => {
    return loadDocBookmarkedPages(book.id);
  });
  const [highlights, setHighlights] = useState<HighlightItem[]>(() => {
    return loadDocHighlights(book.id);
  });
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    return loadDocNotes(book.id);
  });

  // Active Drawers / Modals
  const [activeDrawer, setActiveDrawer] = useState<
    'contents' | 'progress' | 'appearance' | 'note' | 'more' | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reader Settings: Theme, Zoom, Layout Mode, Rotation
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [viewMode, setViewMode] = useState<ReaderViewMode>(() => {
    try {
      const saved = localStorage.getItem('vedora_reader_view_mode') as ReaderViewMode;
      if (saved === 'continuous' || saved === 'single') {
        return saved;
      }
    } catch {}
    return 'continuous';
  });
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  const handleUpdateViewMode = (newMode: ReaderViewMode) => {
    setViewMode(newMode);
    try {
      localStorage.setItem('vedora_reader_view_mode', newMode);
    } catch {}
  };

  // In-document search
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeSearchMatch, setActiveSearchMatch] = useState<SearchMatchItem | null>(null);

  // Note attachment from selection
  const [attachedSelectionForNote, setAttachedSelectionForNote] = useState<{
    text: string;
    page: number;
  } | null>(null);

  // PDF engine state for imported documents
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(Boolean(book.isImported));
  const [pdfError, setPdfError] = useState<string | null>(book.error || null);

  const progressDebounceTimerRef = useRef<any>(null);
  const lastSavedProgressRef = useRef<{ page: number; progress: number }>({
    page: currentPage,
    progress: progress,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  // 1. Load the PDF document
  useEffect(() => {
    let currentLoadedPdf: PDFDocumentProxy | null = null;
    let isCancelled = false;

    if (!book.isImported) {
      setIsLoadingPdf(false);
      return;
    }

    async function initPdf() {
      setIsLoadingPdf(true);
      setPdfError(null);
      try {
        let blobToUse = book.blob;
        if (!blobToUse) {
          blobToUse = (await getPdfBlob(book.id)) || undefined;
        }
        if (!blobToUse) {
          throw new Error(
            `Unable to read PDF file for "${book.fileName || book.title}". The document data is missing from local storage.`
          );
        }

        const loadedPdf = await loadPdfDocument(blobToUse);
        if (isCancelled) {
          try {
            loadedPdf.destroy();
          } catch {}
          return;
        }

        currentLoadedPdf = loadedPdf;
        setPdfDoc(loadedPdf);
        const actualTotalPages = loadedPdf.numPages || 1;
        setTotalPages(actualTotalPages);

        const initialPage = Math.min(
          actualTotalPages,
          Math.max(1, book.currentPage || 1)
        );
        setCurrentPage(initialPage);
        const initialProgress = Math.round((initialPage / actualTotalPages) * 100);
        setProgress(initialProgress);
        lastSavedProgressRef.current = { page: initialPage, progress: initialProgress };
        setIsLoadingPdf(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load PDF document:', err);
        setPdfError(err.message || 'Failed to render PDF document.');
        setIsLoadingPdf(false);
      }
    }

    initPdf();

    return () => {
      isCancelled = true;
      if (currentLoadedPdf) {
        try {
          currentLoadedPdf.destroy();
        } catch {}
      }
    };
  }, [book.id]);

  // Flush pending progress on unmount
  useEffect(() => {
    return () => {
      if (progressDebounceTimerRef.current) {
        clearTimeout(progressDebounceTimerRef.current);
      }
      if (onUpdateProgress) {
        const { page, progress: prog } = lastSavedProgressRef.current;
        onUpdateProgress(book.id, prog, page);
      }
    };
  }, [book.id, onUpdateProgress]);

  // Page synchronization from continuous scroll viewer
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      const newProgress = Math.round((newPage / totalPages) * 100);
      setProgress(newProgress);
      lastSavedProgressRef.current = { page: newPage, progress: newProgress };

      if (progressDebounceTimerRef.current) {
        clearTimeout(progressDebounceTimerRef.current);
      }
      progressDebounceTimerRef.current = setTimeout(() => {
        if (onUpdateProgress) {
          onUpdateProgress(book.id, newProgress, newPage);
        }
      }, 600);
    },
    [totalPages, book.id, onUpdateProgress]
  );

  // Jump smoothly to a targeted page number
  const handleNavigateToPage = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages, targetPage));
      setCurrentPage(clamped);
      setScrollToPageTarget(clamped);
      const newProg = Math.round((clamped / totalPages) * 100);
      setProgress(newProg);
      lastSavedProgressRef.current = { page: clamped, progress: newProg };

      if (onUpdateProgress) {
        onUpdateProgress(book.id, newProg, clamped);
      }
    },
    [totalPages, book.id, onUpdateProgress]
  );

  // Slider change triggers smooth scroll to targeted page
  const sliderScrollDebounceRef = useRef<any>(null);
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setProgress(val);
    const target = Math.max(1, Math.round((val / 100) * totalPages));
    setCurrentPage(target);
    lastSavedProgressRef.current = { page: target, progress: val };

    if (sliderScrollDebounceRef.current) {
      clearTimeout(sliderScrollDebounceRef.current);
    }
    sliderScrollDebounceRef.current = setTimeout(() => {
      setScrollToPageTarget(target);
      if (onUpdateProgress) {
        onUpdateProgress(book.id, val, target);
      }
    }, 120);
  };

  // Bookmark toggle for current page
  const isCurrentPageBookmarked = bookmarkedPages.includes(currentPage);
  const handleToggleBookmark = () => {
    const isNowBookmarked = toggleDocPageBookmark(book.id, currentPage);
    const updated = loadDocBookmarkedPages(book.id);
    setBookmarkedPages(updated);
    showToast(
      isNowBookmarked
        ? `Bookmarked Page ${currentPage}`
        : `Removed bookmark for Page ${currentPage}`
    );
  };

  // Highlights handlers
  const handleAddHighlight = useCallback(
    (highlight: HighlightItem) => {
      setHighlights((prev) => {
        const updated = [highlight, ...prev];
        saveDocHighlights(book.id, updated);
        return updated;
      });
    },
    [book.id]
  );

  const handleDeleteHighlight = useCallback(
    (highlightId: string) => {
      setHighlights((prev) => {
        const updated = prev.filter((h) => h.id !== highlightId);
        saveDocHighlights(book.id, updated);
        return updated;
      });
    },
    [book.id]
  );

  // Notes save handler
  const handleSaveNotes = useCallback(
    (updatedNotes: NoteItem[]) => {
      setNotes(updatedNotes);
      saveDocNotes(book.id, updatedNotes);
    },
    [book.id]
  );

  // Open note drawer with selected text
  const handleOpenNoteWithSelection = useCallback(
    (selectedText: string, page: number) => {
      setAttachedSelectionForNote({ text: selectedText, page });
      setActiveDrawer('note');
    },
    []
  );

  // Search match navigation handler
  const handleNavigateToSearchMatch = useCallback(
    (match: SearchMatchItem | null) => {
      setActiveSearchMatch(match);
      if (match) {
        handleNavigateToPage(match.page);
      }
    },
    [handleNavigateToPage]
  );

  // Rotate view 90 degrees
  const handleRotateView = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  // Toggle view mode between continuous scroll and single page
  const handleToggleViewMode = useCallback(() => {
    setViewMode((v) => {
      const next = v === 'continuous' ? 'single' : 'continuous';
      try {
        localStorage.setItem('vedora_reader_view_mode', next);
      } catch {}
      return next;
    });
  }, []);

  // Theme styling definitions with Warm Literary Palette
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  const readerBgClass = isDark
    ? 'bg-[#1F1F1D] text-[#E8E0D3]'
    : isSepia
    ? 'bg-[#F4EDE4] text-[#3A3026]'
    : 'bg-[#F5F0E6] text-[#302C26]';

  const headerFooterBg = isDark
    ? 'bg-[#1F1F1D]/95 border-zinc-800'
    : isSepia
    ? 'bg-[#F4EDE4]/95 border-[#E4DCCE]'
    : 'bg-[#F5F0E6]/95 border-[#E4DCCE]';

  const iconColor = isDark
    ? 'text-[#E8E0D3] hover:text-white'
    : 'text-[#777064] hover:text-[#302C26]';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none animate-in fade-in duration-150 ${readerBgClass}`}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#302C26]/90 text-[#FBF8F1] text-xs font-medium py-1.5 px-4 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          <Sparkles className="w-3.5 h-3.5 text-[#927B5C] dark:text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* In-Document Search Bar */}
      <SearchToolbar
        pdfDoc={pdfDoc}
        totalPages={totalPages}
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setActiveSearchMatch(null);
        }}
        onNavigateToMatch={handleNavigateToSearchMatch}
        onShowToast={showToast}
        theme={theme}
      />

      {/* Top App Bar with Literary Elegance */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b transition-colors ${headerFooterBg}`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Back to Library"
          >
            <ArrowLeft className={`w-5 h-5 ${iconColor}`} />
          </button>
        </div>

        {/* Center Title and Mode Switcher */}
        <div className="text-center px-2 flex-1 min-w-0 max-w-[280px]">
          <h3 className="font-serif-display font-semibold text-xs sm:text-sm tracking-tight truncate">
            {book.fileName || book.title}
          </h3>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {/* Quick Mode Toggle Pill: Continuous Scroll vs Single Page */}
            <button
              type="button"
              onClick={() => {
                const nextMode: ReaderViewMode =
                  viewMode === 'continuous' ? 'single' : 'continuous';
                handleUpdateViewMode(nextMode);
                showToast(
                  nextMode === 'continuous'
                    ? 'Switched to Continuous Scroll'
                    : 'Switched to Single Page'
                );
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium border border-[#E4DCCE] dark:border-zinc-700 bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors cursor-pointer"
              title="Click to toggle between Continuous Scroll and Single Page"
            >
              {viewMode === 'continuous' ? (
                <ScrollText className="w-2.5 h-2.5 text-[#154D43] dark:text-teal-400" />
              ) : (
                <FileText className="w-2.5 h-2.5 text-[#154D43] dark:text-teal-400" />
              )}
              <span>
                {viewMode === 'continuous' ? 'Continuous Scroll' : 'Single Page'}
              </span>
            </button>
            <span className="text-[10px] text-[#777064] dark:text-zinc-400 tabular-nums">
              p. {currentPage}/{totalPages}
            </span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              isSearchOpen ? 'bg-[#154D43] text-white shadow-2xs' : iconColor
            }`}
            title="Search in document"
          >
            <Search className="w-4 h-4" />
          </button>
          {/* Bookmark Button for Current Page */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Bookmark page"
            title={isCurrentPageBookmarked ? `Bookmarked Page ${currentPage}` : `Add bookmark for Page ${currentPage}`}
          >
            <Bookmark
              className={`w-4 h-4 ${
                isCurrentPageBookmarked
                  ? 'text-[#154D43] dark:text-teal-400 fill-[#154D43] dark:fill-teal-400'
                  : iconColor
              }`}
            />
          </button>
          {/* Appearance Drawer Trigger */}
          <button
            type="button"
            onClick={() => setActiveDrawer('appearance')}
            className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${iconColor}`}
            title="Appearance & Typography"
          >
            <Type className="w-4 h-4" />
          </button>
          {/* More Actions Menu */}
          <button
            type="button"
            onClick={() => setActiveDrawer('more')}
            className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${iconColor}`}
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body View */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {pdfError ? (
          <div className="my-auto p-6 max-w-sm mx-auto bg-white dark:bg-zinc-900 rounded-3xl border border-red-200 dark:border-red-900 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/60 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm">Cannot Open Document</h4>
            <p className="text-xs text-stone-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {pdfError}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 px-5 py-2.5 bg-[#154D43] text-white text-xs font-semibold rounded-xl hover:bg-[#0E3A32] cursor-pointer"
            >
              Back to Library
            </button>
          </div>
        ) : isLoadingPdf ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-8">
            <div className="w-10 h-10 border-3 border-[#154D43]/20 border-t-[#154D43] rounded-full animate-spin mb-4" />
            <h4 className="font-semibold text-sm">
              Rendering {book.fileName || book.title}
            </h4>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
              Loading original PDF pages, text layer & fonts...
            </p>
          </div>
        ) : book.isImported && pdfDoc ? (
          <ContinuousPdfViewer
            pdfDoc={pdfDoc}
            documentId={book.id}
            documentName={book.fileName || book.title}
            totalPages={totalPages}
            initialPage={book.currentPage || 1}
            currentPage={currentPage}
            zoomScale={zoomScale}
            rotation={rotation}
            theme={theme}
            viewMode={viewMode}
            onPageChange={handlePageChange}
            highlights={highlights}
            onAddHighlight={handleAddHighlight}
            onDeleteHighlight={handleDeleteHighlight}
            onShowToast={showToast}
            scrollToPageTarget={scrollToPageTarget}
            onScrollTargetCompleted={() => setScrollToPageTarget(null)}
            onOpenNoteWithSelection={handleOpenNoteWithSelection}
            activeSearchMatch={activeSearchMatch}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl mx-auto w-full leading-relaxed select-text">
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-medium font-sans">
                {book.id === 'atomic-habits' ? 'CHAPTER 1' : 'CHAPTER 2'}
              </span>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold mt-2 tracking-tight">
                {book.id === 'atomic-habits'
                  ? 'The Surprising Power of Atomic Habits'
                  : book.id === 'design-of-everyday-things'
                  ? 'The Psychopathology of Everyday Things'
                  : 'The Power of Compounding'}
              </h1>
            </div>
            <div className="font-editorial text-[17px] sm:text-[18px] space-y-5 leading-[1.75]">
              {book.id === 'atomic-habits' ? (
                <>
                  <p className="bg-[#FEF08A]/70 px-2 py-1 rounded-sm text-stone-900 border-l-2 border-amber-500 shadow-2xs">
                    Habits are the compound interest of self-improvement. Getting 1 percent better every day counts for a lot in the long-run.
                  </p>
                  <p>
                    It is so easy to overestimate the importance of one defining moment and underestimate the value of making small improvements on a daily basis.
                  </p>
                  <blockquote className="my-6 pl-4 italic border-l-[3px] border-[#154D43] py-1 text-lg">
                    “You do not rise to the level of your goals. You fall to the level of your systems.”
                  </blockquote>
                </>
              ) : (
                <>
                  <p className="bg-[#FEF08A]/70 px-2 py-1 rounded-sm text-stone-900 border-l-2 border-amber-500 shadow-2xs">
                    The first rule of compounding is to never interrupt it unnecessarily. Give it time, and it will do its work for you.
                  </p>
                  <p>
                    Compounding is powerful because it builds on itself. The returns you earn generate their own returns, leading to exponential growth over time.
                  </p>
                  <blockquote className="my-6 pl-4 italic border-l-[3px] border-[#154D43] py-1 text-lg">
                    “Wealth is not about income or intelligence. It’s about behaviour.”
                  </blockquote>
                  <p>
                    More than 2,000 books have been written on Warren Buffett. He is a phenomenal investor, but few appreciate that his skill was investing, while his secret was time.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reader Bottom Controls */}
      <footer
        className={`sticky bottom-0 z-20 backdrop-blur-md border-t px-4 py-3 transition-colors ${headerFooterBg}`}
      >
        {/* Progress Slider */}
        <div className="max-w-md mx-auto mb-2.5">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="100"
              value={progress}
              onChange={handleSliderChange}
              className="w-full accent-[#154D43] dark:accent-teal-400 h-1 bg-[#E4DCCE] dark:bg-zinc-700 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#777064] dark:text-zinc-400 font-sans font-medium mt-1 tabular-nums px-1">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="font-semibold text-[#154D43] dark:text-teal-400">{progress}%</span>
          </div>
        </div>

        {/* 5 Bottom Action Buttons */}
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto text-[#777064] dark:text-zinc-400 font-sans">
          {[
            { id: 'contents', label: 'Contents', icon: List },
            { id: 'progress', label: 'Progress', icon: Sliders },
            { id: 'appearance', label: 'Appearance', icon: Type },
            { id: 'note', label: 'Note', icon: Edit3 },
            { id: 'more', label: 'More', icon: MoreVertical },
          ].map((action) => {
            const Icon = action.icon;
            const isActive = activeDrawer === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (activeDrawer === action.id) {
                    setActiveDrawer(null);
                  } else {
                    setActiveDrawer(action.id as any);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#154D43] dark:text-teal-400 font-bold'
                    : 'hover:text-[#302C26] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px]">{action.label}</span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* 1. CONTENTS DRAWER */}
      <ContentsDrawer
        pdfDoc={pdfDoc}
        totalPages={totalPages}
        currentPage={currentPage}
        isOpen={activeDrawer === 'contents'}
        onClose={() => setActiveDrawer(null)}
        onNavigateToPage={handleNavigateToPage}
        theme={theme}
      />

      {/* 2. PROGRESS DRAWER */}
      <ProgressDrawer
        isOpen={activeDrawer === 'progress'}
        onClose={() => setActiveDrawer(null)}
        documentTitle={book.fileName || book.title}
        currentPage={currentPage}
        totalPages={totalPages}
        progress={progress}
        highlightsCount={highlights.length}
        notesCount={notes.length}
        bookmarksCount={bookmarkedPages.length}
        onNavigateToPage={handleNavigateToPage}
        theme={theme}
      />

      {/* 3. APPEARANCE DRAWER */}
      <AppearanceDrawer
        isOpen={activeDrawer === 'appearance'}
        onClose={() => setActiveDrawer(null)}
        theme={theme}
        onChangeTheme={setTheme}
        zoomScale={zoomScale}
        onChangeZoom={setZoomScale}
        viewMode={viewMode}
        onChangeViewMode={handleUpdateViewMode}
      />

      {/* 4. NOTE DRAWER */}
      <NoteDrawer
        isOpen={activeDrawer === 'note'}
        onClose={() => {
          setActiveDrawer(null);
          setAttachedSelectionForNote(null);
        }}
        documentId={book.id}
        documentTitle={book.fileName || book.title}
        currentPage={currentPage}
        totalPages={totalPages}
        initialAttachedText={attachedSelectionForNote?.text}
        initialAttachedPage={attachedSelectionForNote?.page}
        notes={notes}
        onSaveNotes={handleSaveNotes}
        onNavigateToPage={handleNavigateToPage}
        onShowToast={showToast}
        theme={theme}
      />

      {/* 5. MORE DRAWER */}
      <MoreDrawer
        isOpen={activeDrawer === 'more'}
        onClose={() => setActiveDrawer(null)}
        documentTitle={book.fileName || book.title}
        fileSize={book.fileSize}
        totalPages={totalPages}
        currentPage={currentPage}
        progress={progress}
        rotation={rotation}
        onRotate={handleRotateView}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onNavigateToPage={handleNavigateToPage}
        highlights={highlights}
        notes={notes}
        bookmarksCount={bookmarkedPages.length}
        onShowToast={showToast}
        theme={theme}
      />
    </div>
  );
};
