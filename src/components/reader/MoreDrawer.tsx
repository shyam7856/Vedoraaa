import React, { useState } from 'react';
import {
  X,
  RotateCw,
  ScrollText,
  FileText,
  Download,
  Info,
  Share2,
  ChevronRight,
  Hash,
  Sparkles,
} from 'lucide-react';
import { HighlightItem, NoteItem, ReaderViewMode } from '../../types';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  fileSize: string;
  totalPages: number;
  currentPage: number;
  progress: number;
  rotation: number;
  onRotate: () => void;
  viewMode: ReaderViewMode;
  onToggleViewMode: () => void;
  onNavigateToPage: (page: number) => void;
  highlights: HighlightItem[];
  notes: NoteItem[];
  bookmarksCount: number;
  onShowToast: (msg: string) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({
  isOpen,
  onClose,
  documentTitle,
  fileSize,
  totalPages,
  currentPage,
  progress,
  rotation,
  onRotate,
  viewMode,
  onToggleViewMode,
  onNavigateToPage,
  highlights,
  notes,
  bookmarksCount,
  onShowToast,
  theme = 'light',
}) => {
  const [isGoToPageOpen, setIsGoToPageOpen] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [isDocInfoOpen, setIsDocInfoOpen] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  const drawerBg = isDark ? 'bg-[#18181B] text-zinc-100' : isSepia ? 'bg-[#F5EFEB] text-amber-950' : 'bg-[#FAF8F5] text-stone-900';
  const cardBg = isDark ? 'bg-zinc-800/80 border-zinc-700' : isSepia ? 'bg-[#FAF4E8] border-amber-200/80' : 'bg-white border-stone-200/80';

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(goToPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onNavigateToPage(page);
      setIsGoToPageOpen(false);
      onClose();
      onShowToast(`Jumped to Page ${page}`);
    } else {
      onShowToast(`Please enter a page between 1 and ${totalPages}`);
    }
  };

  const handleExportNotesAndHighlights = () => {
    if (highlights.length === 0 && notes.length === 0) {
      onShowToast('No highlights or notes to export yet');
      return;
    }

    const dateStr = new Date().toLocaleDateString();
    let content = `# VEDORA Reading Notes & Highlights\n\n`;
    content += `**Document:** ${documentTitle}\n`;
    content += `**Export Date:** ${dateStr}\n`;
    content += `**Reading Progress:** Page ${currentPage} of ${totalPages} (${progress}%)\n\n`;
    content += `---\n\n`;

    content += `## HIGHLIGHTS (${highlights.length})\n\n`;
    if (highlights.length === 0) {
      content += `_No highlights saved._\n\n`;
    } else {
      highlights.forEach((h, idx) => {
        content += `### ${idx + 1}. Page ${h.page} (${h.color})\n`;
        content += `> "${h.text}"\n\n`;
        if (h.note) {
          content += `*Note:* ${h.note}\n\n`;
        }
      });
    }

    content += `---\n\n`;
    content += `## NOTES (${notes.length})\n\n`;
    if (notes.length === 0) {
      content += `_No notes saved._\n\n`;
    } else {
      notes.forEach((n, idx) => {
        content += `### ${idx + 1}. Page ${n.page} (${new Date(n.createdAt).toLocaleDateString()})\n`;
        if (n.selectedText) {
          content += `> Attached quote: "${n.selectedText}"\n\n`;
        }
        content += `${n.content}\n\n`;
      });
    }

    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      link.href = url;
      link.download = `${safeTitle}_vedora_notes.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast('Notes and highlights exported successfully');
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      onShowToast('Failed to export notes');
    }
  };

  const handleShare = async () => {
    const shareText = `Reading "${documentTitle}" on VEDORA (Page ${currentPage} of ${totalPages}, ${progress}% completed).`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: documentTitle,
          text: shareText,
        });
        onShowToast('Shared document info');
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          navigator.clipboard?.writeText(shareText);
          onShowToast('Reading details copied to clipboard');
        }
      }
    } else {
      navigator.clipboard?.writeText(shareText);
      onShowToast('Reading details copied to clipboard');
    }
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className={`${drawerBg} rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl border-t border-stone-200/80 animate-in slide-in-from-bottom duration-250`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <div className="w-12 h-1 bg-stone-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 mb-1" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/60 dark:border-zinc-800">
            <h3 className="font-serif-display font-bold text-base tracking-tight">
              More Document Actions
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-stone-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Menu Actions */}
          <div className="p-5 overflow-y-auto space-y-2">
            {/* Action 1: Go to page */}
            <button
              type="button"
              onClick={() => setIsGoToPageOpen(true)}
              className={`w-full p-3.5 rounded-2xl border ${cardBg} flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-[#154D43] dark:text-teal-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Go to Page</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Jump directly to any page (1 - {totalPages})
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            {/* Action 2: Rotate view */}
            <button
              type="button"
              onClick={() => {
                onRotate();
                onShowToast(`Rotated view to ${((rotation + 90) % 360)}°`);
              }}
              className={`w-full p-3.5 rounded-2xl border ${cardBg} flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Rotate View</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Turn 90° clockwise (Currently {rotation}°)
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-stone-500">{rotation}°</span>
            </button>

            {/* Action 3: Toggle single-page / continuous view */}
            <button
              type="button"
              onClick={() => {
                onToggleViewMode();
                onShowToast(
                  viewMode === 'continuous'
                    ? 'Switched to Single Page Mode'
                    : 'Switched to Continuous Scroll Mode'
                );
              }}
              className={`w-full p-3.5 rounded-2xl border ${cardBg} flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {viewMode === 'continuous' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <ScrollText className="w-4 h-4" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Switch Reading Mode</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    {viewMode === 'continuous'
                      ? 'Current: Continuous vertical scroll'
                      : 'Current: Focused single page'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#154D43] dark:text-teal-400 capitalize">
                {viewMode === 'continuous' ? 'Single Page' : 'Continuous'}
              </span>
            </button>

            {/* Action 4: Export notes and highlights */}
            <button
              type="button"
              onClick={handleExportNotesAndHighlights}
              className={`w-full p-3.5 rounded-2xl border ${cardBg} flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Export Notes & Highlights</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Download as Markdown file ({highlights.length} highlights, {notes.length} notes)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            {/* Action 5: View document info */}
            <button
              type="button"
              onClick={() => setIsDocInfoOpen(true)}
              className={`w-full p-3.5 rounded-2xl border ${cardBg} flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Document Information</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    File size, page count, and reading status
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            {/* Action 6: Share */}
            <button
              type="button"
              onClick={handleShare}
              className={`w-full p-3.5 rounded-2xl border ${cardBg} flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Share Document</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Share reading progress via system share sheet
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: GO TO PAGE DIALOG */}
      {isGoToPageOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsGoToPageOpen(false)}
        >
          <div
            className={`p-5 rounded-3xl max-w-xs w-full border ${cardBg} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">Jump to Page</h4>
              <button
                type="button"
                onClick={() => setIsGoToPageOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleGoToSubmit}>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mb-2">
                Enter page number between 1 and {totalPages}:
              </p>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                placeholder={`Current is ${currentPage}`}
                autoFocus
                className="w-full text-sm font-semibold p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#154D43] mb-4 text-center tabular-nums"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoToPageOpen(false)}
                  className="flex-1 py-2 text-xs font-medium border border-stone-200 dark:border-zinc-700 rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-[#154D43] text-white rounded-xl hover:bg-[#0E3A32] cursor-pointer"
                >
                  Go
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENT INFORMATION DIALOG */}
      {isDocInfoOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsDocInfoOpen(false)}
        >
          <div
            className={`p-5 rounded-3xl max-w-sm w-full border ${cardBg} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h4 className="font-serif-display font-bold text-sm">Document Information</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsDocInfoOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">File Name</span>
                <span className="font-semibold truncate max-w-[180px]">{documentTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">Format</span>
                <span className="font-semibold">Portable Document Format (PDF)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">File Size</span>
                <span className="font-semibold tabular-nums">{fileSize || 'Standard'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">Total Pages</span>
                <span className="font-semibold tabular-nums">{totalPages} pages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">Current Position</span>
                <span className="font-semibold tabular-nums">Page {currentPage} ({progress}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">Saved Highlights</span>
                <span className="font-semibold tabular-nums">{highlights.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-stone-500">Saved Notes</span>
                <span className="font-semibold tabular-nums">{notes.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Bookmarked Pages</span>
                <span className="font-semibold tabular-nums">{bookmarksCount}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDocInfoOpen(false)}
              className="mt-4 w-full py-2 bg-[#154D43] text-white text-xs font-semibold rounded-xl hover:bg-[#0E3A32] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
