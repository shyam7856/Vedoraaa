import React, { useState, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { X, FileText, Compass, Hash, Sparkles } from 'lucide-react';

interface TocItem {
  id: string;
  title: string;
  pageNumber: number | null;
  items?: TocItem[];
}

interface ContentsDrawerProps {
  pdfDoc: PDFDocumentProxy | null;
  totalPages: number;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (pageNumber: number) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export const ContentsDrawer: React.FC<ContentsDrawerProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  isOpen,
  onClose,
  onNavigateToPage,
  theme = 'light',
}) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [isLoadingToc, setIsLoadingToc] = useState<boolean>(true);
  const [hasOutline, setHasOutline] = useState<boolean>(false);
  const [customPageInput, setCustomPageInput] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !pdfDoc) return;
    let isCancelled = false;

    async function parseDest(dest: any): Promise<number | null> {
      if (!pdfDoc || !dest) return null;
      try {
        let resolvedDest = dest;
        if (typeof dest === 'string') {
          resolvedDest = await pdfDoc.getDestination(dest);
        }
        if (Array.isArray(resolvedDest) && resolvedDest.length > 0) {
          const first = resolvedDest[0];
          if (typeof first === 'number') {
            return first + 1;
          }
          if (first && typeof first === 'object') {
            const pageIdx = await pdfDoc.getPageIndex(first);
            return pageIdx + 1;
          }
        }
      } catch (err) {
        console.warn('Could not resolve destination:', err);
      }
      return null;
    }

    async function processOutlineNode(node: any, idxPrefix: string): Promise<TocItem> {
      const pageNum = await parseDest(node.dest);
      const children: TocItem[] = [];
      if (Array.isArray(node.items) && node.items.length > 0) {
        for (let i = 0; i < node.items.length; i++) {
          children.push(await processOutlineNode(node.items[i], `${idxPrefix}_${i}`));
        }
      }
      return {
        id: idxPrefix,
        title: node.title ? node.title.trim() : 'Untitled Section',
        pageNumber: pageNum,
        items: children.length > 0 ? children : undefined,
      };
    }

    async function loadOutline() {
      if (!pdfDoc) {
        setIsLoadingToc(false);
        setHasOutline(false);
        return;
      }
      setIsLoadingToc(true);
      try {
        const rawOutline = await pdfDoc.getOutline();
        if (isCancelled) return;
        if (Array.isArray(rawOutline) && rawOutline.length > 0) {
          const parsed: TocItem[] = [];
          for (let i = 0; i < rawOutline.length; i++) {
            parsed.push(await processOutlineNode(rawOutline[i], `toc_${i}`));
          }
          if (!isCancelled) {
            setTocItems(parsed);
            setHasOutline(true);
          }
        } else {
          if (!isCancelled) {
            setTocItems([]);
            setHasOutline(false);
          }
        }
      } catch (err) {
        console.warn('Failed to parse PDF outline:', err);
        if (!isCancelled) {
          setHasOutline(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingToc(false);
        }
      }
    }

    loadOutline();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, pdfDoc]);

  if (!isOpen) return null;

  const handleJump = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onNavigateToPage(page);
      onClose();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customPageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      handleJump(num);
    }
  };

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  const drawerBg = isDark ? 'bg-[#18181B] text-zinc-100' : isSepia ? 'bg-[#F5EFEB] text-amber-950' : 'bg-[#FAF8F5] text-stone-900';
  const cardBg = isDark ? 'bg-zinc-800/80 border-zinc-700' : isSepia ? 'bg-[#FAF4E8] border-amber-200/80' : 'bg-white border-stone-200/80';

  const renderTocNodes = (items: TocItem[], level = 0) => {
    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-3 pl-2.5 border-l border-stone-200/60 dark:border-zinc-800' : ''}`}>
        {items.map((item) => {
          const isCurrent = item.pageNumber === currentPage;
          return (
            <div key={item.id} className="group">
              <button
                type="button"
                onClick={() => {
                  if (item.pageNumber) {
                    handleJump(item.pageNumber);
                  }
                }}
                disabled={!item.pageNumber}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors text-xs cursor-pointer ${
                  isCurrent
                    ? 'bg-[#154D43] text-white font-semibold shadow-xs'
                    : isDark
                    ? 'hover:bg-zinc-800 text-zinc-200'
                    : 'hover:bg-stone-200/70 text-stone-800'
                } ${!item.pageNumber ? 'opacity-60 cursor-default' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-teal-200' : 'text-stone-400'}`} />
                  <span className="truncate">{item.title}</span>
                </div>
                {item.pageNumber && (
                  <span
                    className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-medium ${
                      isCurrent
                        ? 'bg-teal-700/60 text-white'
                        : isDark
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-stone-200/70 text-stone-600'
                    }`}
                  >
                    p. {item.pageNumber}
                  </span>
                )}
              </button>
              {item.items && item.items.length > 0 && renderTocNodes(item.items, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${drawerBg} rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl border-t border-stone-200/80 animate-in slide-in-from-bottom duration-250`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-stone-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
            <h3 className="font-serif-display font-bold text-base tracking-tight">
              Table of Contents
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-stone-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoadingToc ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-[#154D43]/20 border-t-[#154D43] rounded-full animate-spin mb-3" />
              <p className="text-xs text-stone-500">Reading PDF document bookmarks...</p>
            </div>
          ) : hasOutline && tocItems.length > 0 ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400 mb-2 px-1">
                <span>{tocItems.length} Outline Chapters</span>
                <span className="text-[#154D43] dark:text-teal-400 font-semibold">Current: Page {currentPage}</span>
              </div>
              {renderTocNodes(tocItems)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-3.5 rounded-2xl border ${cardBg}`}>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">No Embedded Outline Found</h4>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      This PDF does not contain digital bookmark metadata. You can navigate directly using the page milestones and grid below.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCustomSubmit} className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={customPageInput}
                      onChange={(e) => setCustomPageInput(e.target.value)}
                      placeholder={`Jump to page (1 - ${totalPages})...`}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#154D43]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#154D43] text-white text-xs font-semibold rounded-xl hover:bg-[#0E3A32] cursor-pointer"
                  >
                    Go
                  </button>
                </form>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block mb-2 px-1">
                  Reading Milestones
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Start', page: 1 },
                    { label: '25%', page: Math.max(1, Math.round(totalPages * 0.25)) },
                    { label: '50%', page: Math.max(1, Math.round(totalPages * 0.5)) },
                    { label: '75%', page: Math.max(1, Math.round(totalPages * 0.75)) },
                  ].map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => handleJump(m.page)}
                      className={`p-2 rounded-xl text-center border text-xs cursor-pointer transition-colors ${
                        currentPage === m.page
                          ? 'bg-[#154D43] text-white font-bold border-[#154D43]'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                          : 'bg-white border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-semibold">{m.label}</div>
                      <div className="text-[10px] opacity-75 tabular-nums">Page {m.page}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">
                  <span>All Pages ({totalPages})</span>
                  <span>Tap to jump</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 max-h-52 overflow-y-auto p-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isCur = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleJump(p)}
                        className={`h-9 rounded-xl flex items-center justify-center text-xs font-medium tabular-nums border cursor-pointer transition-all ${
                          isCur
                            ? 'bg-[#154D43] text-white font-bold border-[#154D43] shadow-xs'
                            : isDark
                            ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                            : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
