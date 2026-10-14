import React, { useState } from 'react';
import { X, Sliders, Clock, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';

interface ProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  currentPage: number;
  totalPages: number;
  progress: number;
  highlightsCount: number;
  notesCount: number;
  bookmarksCount: number;
  onNavigateToPage: (page: number) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export const ProgressDrawer: React.FC<ProgressDrawerProps> = ({
  isOpen,
  onClose,
  documentTitle,
  currentPage,
  totalPages,
  progress,
  highlightsCount,
  notesCount,
  bookmarksCount,
  onNavigateToPage,
  theme = 'light',
}) => {
  const [sliderVal, setSliderVal] = useState<number>(currentPage);

  if (!isOpen) return null;

  const pagesRemaining = Math.max(0, totalPages - currentPage);
  const estMinutesRemaining = Math.round(pagesRemaining * 1.5);
  const estHours = Math.floor(estMinutesRemaining / 60);
  const estMins = estMinutesRemaining % 60;
  const timeString =
    pagesRemaining === 0
      ? 'Completed!'
      : estHours > 0
      ? `${estHours}h ${estMins}m left`
      : `${estMins} mins left`;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  const drawerBg = isDark ? 'bg-[#18181B] text-zinc-100' : isSepia ? 'bg-[#F5EFEB] text-amber-950' : 'bg-[#FAF8F5] text-stone-900';
  const cardBg = isDark ? 'bg-zinc-800/80 border-zinc-700' : isSepia ? 'bg-[#FAF4E8] border-amber-200/80' : 'bg-white border-stone-200/80';

  const handleSliderCommit = () => {
    onNavigateToPage(sliderVal);
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
            <Sliders className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
            <h3 className="font-serif-display font-bold text-base tracking-tight">
              Reading Progress & Stats
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

        <div className="p-5 overflow-y-auto space-y-4">
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <h4 className="text-xs font-semibold text-stone-500 dark:text-zinc-400 truncate mb-3">
              {documentTitle}
            </h4>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold font-serif-display tracking-tight text-[#154D43] dark:text-teal-400">
                  {progress}%
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 ml-2 font-medium">completed</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold tabular-nums">Page {currentPage}</span>
                <span className="text-xs text-stone-400 ml-1">/ {totalPages}</span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-stone-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#154D43] dark:bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#154D43] dark:text-teal-400 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-stone-400">Remaining</div>
                  <div className="font-semibold tabular-nums">{pagesRemaining} pages</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-stone-400">Est. Time Left</div>
                  <div className="font-semibold">{timeString}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span>Quick Navigate to Page</span>
              <span className="text-[#154D43] dark:text-teal-400 tabular-nums">Page {sliderVal}</span>
            </div>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={sliderVal}
              onChange={(e) => setSliderVal(parseInt(e.target.value, 10))}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              className="w-full accent-[#154D43] dark:accent-teal-400 h-2 bg-stone-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 tabular-nums">
              <span>Page 1</span>
              <span>Page {totalPages}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => {
                  onNavigateToPage(1);
                  setSliderVal(1);
                  onClose();
                }}
                className="py-1.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>First Page</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigateToPage(totalPages);
                  setSliderVal(totalPages);
                  onClose();
                }}
                className="py-1.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span>Last Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`p-3 rounded-xl border text-center ${cardBg}`}>
              <div className="text-base font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                {highlightsCount}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">Highlights</div>
            </div>
            <div className={`p-3 rounded-xl border text-center ${cardBg}`}>
              <div className="text-base font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                {notesCount}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">Notes</div>
            </div>
            <div className={`p-3 rounded-xl border text-center ${cardBg}`}>
              <div className="text-base font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                {bookmarksCount}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">Bookmarks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
