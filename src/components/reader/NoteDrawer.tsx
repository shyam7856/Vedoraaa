import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Check, ArrowRight, Quote, Plus, BookOpen } from 'lucide-react';
import { NoteItem, HighlightColor } from '../../types';

interface NoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  currentPage: number;
  totalPages: number;
  initialAttachedText?: string | null;
  initialAttachedPage?: number | null;
  notes: NoteItem[];
  onSaveNotes: (updatedNotes: NoteItem[]) => void;
  onNavigateToPage: (page: number) => void;
  onShowToast: (msg: string) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

const PASTEL_TAGS: Array<{ id: HighlightColor; hex: string; label: string }> = [
  { id: 'teal', hex: '#99F6E4', label: 'Idea' },
  { id: 'yellow', hex: '#FEF08A', label: 'Important' },
  { id: 'rose', hex: '#FECDD3', label: 'Key takeaway' },
  { id: 'blue', hex: '#BFDBFE', label: 'Question' },
  { id: 'purple', hex: '#DDD6FE', label: 'Insight' },
];

export const NoteDrawer: React.FC<NoteDrawerProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  currentPage,
  totalPages,
  initialAttachedText,
  initialAttachedPage,
  notes,
  onSaveNotes,
  onNavigateToPage,
  onShowToast,
  theme = 'light',
}) => {
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<HighlightColor>('teal');
  const [notePage, setNotePage] = useState<number>(currentPage);
  const [attachedText, setAttachedText] = useState<string | null>(initialAttachedText || null);
  const [filterMode, setFilterMode] = useState<'this_page' | 'all'>('this_page');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialAttachedText) {
        setAttachedText(initialAttachedText);
        setNotePage(initialAttachedPage || currentPage);
      } else {
        setNotePage(currentPage);
      }
    }
  }, [isOpen, initialAttachedText, initialAttachedPage, currentPage]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  const drawerBg = isDark ? 'bg-[#18181B] text-zinc-100' : isSepia ? 'bg-[#F5EFEB] text-amber-950' : 'bg-[#FAF8F5] text-stone-900';
  const cardBg = isDark ? 'bg-zinc-800/80 border-zinc-700' : isSepia ? 'bg-[#FAF4E8] border-amber-200/80' : 'bg-white border-stone-200/80';

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newNote: NoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      documentId,
      documentName: documentTitle,
      page: notePage,
      content: content.trim(),
      selectedText: attachedText || undefined,
      color: selectedTag,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newNote, ...notes];
    onSaveNotes(updated);
    setContent('');
    setAttachedText(null);
    onShowToast(`Note saved for Page ${notePage}`);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    onSaveNotes(updated);
    onShowToast('Note deleted');
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) return;
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, content: editContent.trim(), updatedAt: Date.now() } : n
    );
    onSaveNotes(updated);
    setEditingNoteId(null);
    onShowToast('Note updated');
  };

  const visibleNotes =
    filterMode === 'this_page'
      ? notes.filter((n) => n.page === currentPage)
      : notes;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${drawerBg} rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-stone-200/80 animate-in slide-in-from-bottom duration-250`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-stone-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#154D43] dark:text-teal-400" />
            <h3 className="font-serif-display font-bold text-base tracking-tight">
              Document Notes
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <form onSubmit={handleCreateNote} className={`p-4 rounded-2xl border ${cardBg} shadow-xs`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-stone-800 dark:text-zinc-200">
                <Plus className="w-3.5 h-3.5 text-[#154D43] dark:text-teal-400" />
                Add Note for Page {notePage}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-stone-500">
                <span>Page:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={notePage}
                  onChange={(e) => setNotePage(parseInt(e.target.value, 10) || 1)}
                  className="w-12 px-1 py-0.5 text-xs text-center border border-stone-200 dark:border-zinc-700 rounded-md bg-stone-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            {attachedText && (
              <div className="mb-2.5 p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-stone-800 dark:text-teal-200 flex items-start gap-2 relative">
                <Quote className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <p className="line-clamp-2 italic pr-5">“{attachedText}”</p>
                <button
                  type="button"
                  onClick={() => setAttachedText(null)}
                  className="absolute top-2 right-2 text-stone-400 hover:text-stone-700"
                  title="Remove quote"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note, thoughts, or key summary..."
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#154D43] leading-relaxed resize-none"
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {PASTEL_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTag(tag.id)}
                    title={tag.label}
                    className={`w-5 h-5 rounded-full border border-black/15 transition-transform cursor-pointer ${
                      selectedTag === tag.id ? 'scale-125 ring-2 ring-[#154D43] shadow-xs' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: tag.hex }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-1.5 bg-[#154D43] hover:bg-[#0E3A32] disabled:opacity-40 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                Save Note
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              Saved Notes ({notes.length})
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-stone-200/80 dark:bg-zinc-800 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode('this_page')}
                className={`px-2.5 py-0.5 rounded-md font-medium cursor-pointer transition-colors ${
                  filterMode === 'this_page'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                This Page ({notes.filter((n) => n.page === currentPage).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-0.5 rounded-md font-medium cursor-pointer transition-colors ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                All Pages ({notes.length})
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {visibleNotes.length > 0 ? (
              visibleNotes.map((note) => {
                const isEditing = editingNoteId === note.id;
                const tag = PASTEL_TAGS.find((t) => t.id === note.color) || PASTEL_TAGS[0];
                return (
                  <div
                    key={note.id}
                    className={`p-3.5 rounded-2xl border ${cardBg} shadow-2xs hover:shadow-xs transition-shadow`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tag.hex }}
                        />
                        <span className="text-[11px] font-bold text-[#154D43] dark:text-teal-400 tabular-nums">
                          Page {note.page}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToPage(note.page);
                            onClose();
                          }}
                          className="text-[10px] text-[#154D43] dark:text-teal-400 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-stone-100 dark:hover:bg-zinc-800"
                        >
                          <span>Jump</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(note)}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
                          title="Edit note"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {note.selectedText && (
                      <div className="mb-2 p-2 rounded-xl bg-stone-100 dark:bg-zinc-900 border-l-2 border-[#154D43] text-[11px] italic text-stone-700 dark:text-zinc-300">
                        “{note.selectedText}”
                      </div>
                    )}

                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 text-[11px] text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(note.id)}
                            className="px-2.5 py-1 text-[11px] bg-[#154D43] text-white font-medium rounded-lg hover:bg-[#0E3A32] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Update</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-7 h-7 mx-auto text-stone-300 dark:text-zinc-600 mb-2" />
                <p className="text-xs font-semibold text-stone-600 dark:text-zinc-400">
                  {filterMode === 'this_page'
                    ? `No notes saved for Page ${currentPage}`
                    : 'No notes yet in this document'}
                </p>
                <p className="text-[11px] text-stone-400 mt-1 max-w-[220px] mx-auto">
                  Type your reflections above or select text directly in the PDF to attach quotes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
