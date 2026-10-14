/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Bell, X, Sparkles } from 'lucide-react';
import { AndroidFrame } from './components/AndroidFrame';
import { ContinueReadingCard } from './components/ContinueReadingCard';
import { RecentlyOpened } from './components/RecentlyOpened';
import { ShortcutTiles } from './components/ShortcutTiles';
import { GenreList } from './components/GenreList';
import { BottomNav } from './components/BottomNav';
import { ReaderModal } from './components/ReaderModal';
import { BookDetailModal } from './components/BookDetailModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import { LibraryView } from './components/LibraryView';
import { BOOKS } from './data/mockData';
import { Book, GenreType, TabType } from './types';
import {
  ImportedDocument,
  loadDocumentsMetadata,
  updateDocProgress,
  getAllSavedHighlights,
  getAllSavedNotes,
  getAllSavedBookmarks,
  getPdfBlob,
  storePdfDocument,
} from './utils/libraryDb';

export default function App() {
  const [booksList, setBooksList] = useState<Book[]>(BOOKS);
  const [importedDocuments, setImportedDocuments] = useState<ImportedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GenreType | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<'all' | 'favorites' | 'notes' | 'highlights' | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals & Sheets
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [notesFilter, setNotesFilter] = useState<'all' | 'highlights' | 'notes' | 'bookmarks'>('all');

  // Compute all saved highlights, notes, and bookmarks across documents
  const allHighlights = useMemo(() => {
    return getAllSavedHighlights();
  }, [importedDocuments, readingBook, activeTab]);

  const allNotes = useMemo(() => {
    return getAllSavedNotes();
  }, [importedDocuments, readingBook, activeTab]);

  const allBookmarks = useMemo(() => {
    return getAllSavedBookmarks();
  }, [importedDocuments, readingBook, activeTab]);

  // Open document at exact highlight page
  const handleOpenHighlightInReader = async (hl: { documentId: string; page: number; documentName?: string }) => {
    if (hl.documentId.startsWith('pdf_')) {
      const doc = importedDocuments.find((d) => d.id === hl.documentId);
      const blob = await getPdfBlob(hl.documentId);
      if (!blob || !doc) {
        showToast('Document not found in storage');
        return;
      }
      setReadingBook({
        id: doc.id,
        title: doc.name.replace(/\.pdf$/i, ''),
        displayTitle: doc.name,
        fileName: doc.name,
        author: 'Imported Document',
        fileSize: doc.formattedSize,
        fileType: 'PDF',
        progress: Math.round((hl.page / doc.totalPages) * 100),
        totalPages: doc.totalPages,
        currentPage: hl.page,
        coverVariant: 'custom',
        genre: 'Tech',
        isFavorite: doc.isFavorite,
        isImported: true,
        blob: blob,
      });
    } else {
      const book = booksList.find((b) => b.id === hl.documentId) || booksList[0];
      setReadingBook({
        ...book,
        currentPage: hl.page,
      });
    }
  };

  // Load imported documents from storage on initial mount
  const refreshDocuments = useCallback(() => {
    const docs = loadDocumentsMetadata();
    const existingHindiDoc = docs.find((d) => d.name === 'Bhartiya_Kavya_Shastra_Hindi.pdf');
    const needsSeed = docs.length === 0 || !existingHindiDoc || existingHindiDoc.totalPages < 12;

    if (needsSeed) {
      fetch('/test_hindi.pdf')
        .then((res) => (res.ok ? res.blob() : null))
        .then(async (blob) => {
          if (blob) {
            const file = new File([blob], 'Bhartiya_Kavya_Shastra_Hindi.pdf', {
              type: 'application/pdf',
            });
            await storePdfDocument(file);
            setImportedDocuments(loadDocumentsMetadata());
          }
        })
        .catch((err) => {
          console.warn('Initial seed failed:', err);
        });
    } else {
      setImportedDocuments(docs);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Show a quick transient toast message
  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => {
      setActiveToast((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  // The primary "Continue Reading" book (The Psychology of Money)
  const continueReadingBook = useMemo(() => {
    return booksList.find((b) => b.id === 'psychology-of-money') || booksList[0];
  }, [booksList]);

  // Filter books based on search, genre, or shortcut category on Home screen
  const filteredBooks = useMemo(() => {
    return booksList.filter((book) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(query);
        const matchesAuthor = book.author.toLowerCase().includes(query);
        const matchesGenre = book.genre.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAuthor && !matchesGenre) return false;
      }
      // Genre filter
      if (selectedGenre && book.genre !== selectedGenre) {
        return false;
      }
      // Shortcut filter
      if (activeShortcut === 'favorites' && !book.isFavorite) {
        return false;
      }
      return true;
    });
  }, [booksList, searchQuery, selectedGenre, activeShortcut]);

  // Toggle favorite status for sample books
  const handleToggleFavorite = (bookId: string) => {
    setBooksList((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const nextFav = !b.isFavorite;
          showToast(nextFav ? `Added "${b.title}" to Favorites` : `Removed from Favorites`);
          return { ...b, isFavorite: nextFav };
        }
        return b;
      })
    );
  };

  // Update reading progress quietly without re-creating readingBook state
  const handleUpdateProgress = useCallback((bookId: string, progress: number, currentPage?: number) => {
    if (bookId.startsWith('pdf_')) {
      updateDocProgress(bookId, progress, currentPage);
    } else {
      setBooksList((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, progress, currentPage: currentPage || b.currentPage }
            : b
        )
      );
    }
  }, []);

  // Shortcut tile clicks on Home
  const handleSelectShortcut = (category: 'all' | 'favorites' | 'notes' | 'highlights') => {
    if (category === 'all') {
      setActiveTab('library');
      showToast('Opening Library');
    } else if (category === 'favorites') {
      setActiveShortcut((prev) => (prev === 'favorites' ? null : 'favorites'));
      showToast('Filtered by Favorites');
    } else if (category === 'notes') {
      setActiveTab('notes');
      showToast('Opening Notes & Highlights');
    } else if (category === 'highlights') {
      setActiveTab('notes');
      showToast('Opening Highlights');
    }
  };

  // Bottom navigation tab switching
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      setIsProfileOpen(true);
    }
  };

  return (
    <AndroidFrame currentTime="9:41">
      {/* Toast Notification */}
      {activeToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-white text-xs font-medium py-1.5 px-4 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{activeToast}</span>
        </div>
      )}

      {/* SCREEN 1: HOME SCREEN */}
      {activeTab === 'home' && (
        <div className="flex-1 px-5 pt-3 pb-6 flex flex-col justify-between animate-in fade-in duration-150">
          <div>
            {/* Header Bar */}
            <header className="flex items-center justify-between pt-1 pb-3">
              <div>
                <h1 className="font-serif-display font-bold text-[28px] text-stone-900 tracking-tight leading-none">
                  VEDORA
                </h1>
                <p className="text-stone-500 text-[13px] font-normal mt-1 tracking-normal">
                  Your reading space
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-stone-800 hover:bg-stone-200/60 active:scale-95 transition-all cursor-pointer relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-[20px] h-[20px] stroke-[1.9]" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#FAF8F5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="w-9 h-9 rounded-full bg-[#154D43] hover:bg-[#0E3A32] text-white font-bold text-sm flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                  aria-label="Profile"
                >
                  S
                </button>
              </div>
            </header>

            {/* Search Bar */}
            <div className="mt-2.5 relative">
              <div className="w-full bg-[#EFEFEA] hover:bg-[#EBEBE5] focus-within:bg-[#E8E8E1] focus-within:ring-2 focus-within:ring-[#154D43]/20 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 transition-all">
                <Search className="w-[18px] h-[18px] text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for books or files..."
                  className="w-full bg-transparent text-stone-900 placeholder:text-stone-400 text-[14px] outline-none font-normal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Chips */}
            {(selectedGenre || activeShortcut || searchQuery) && (
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[11px] text-stone-500 font-medium">Filtered by:</span>
                {selectedGenre && (
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full cursor-pointer hover:bg-stone-300"
                  >
                    <span>{selectedGenre}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeShortcut && (
                  <button
                    onClick={() => setActiveShortcut(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full cursor-pointer hover:bg-stone-300"
                  >
                    <span className="capitalize">{activeShortcut}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full cursor-pointer hover:bg-stone-300"
                  >
                    <span>"{searchQuery}"</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedGenre(null);
                    setActiveShortcut(null);
                    setSearchQuery('');
                  }}
                  className="text-[10px] text-[#154D43] font-semibold hover:underline ml-1 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Continue Reading Card */}
            {(!searchQuery || continueReadingBook.title.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <div className="mt-4">
                <ContinueReadingCard
                  book={continueReadingBook}
                  onOpenReader={(b) => setReadingBook(b)}
                  onOpenDetails={(b) => setSelectedBookForDetails(b)}
                />
              </div>
            )}

            {/* Recently Opened Carousel */}
            <RecentlyOpened
              books={filteredBooks.filter((b) => b.id !== 'psychology-of-money')}
              onSelectBook={(book) => setSelectedBookForDetails(book)}
              onSeeAll={() => {
                setActiveTab('library');
                showToast('Viewing Library');
              }}
            />

            {/* Shortcut Tiles */}
            <ShortcutTiles
              onSelectCategory={handleSelectShortcut}
              activeCategory={activeShortcut}
            />

            {/* Browse by Genre */}
            <GenreList
              selectedGenre={selectedGenre}
              onSelectGenre={(genre) => {
                setSelectedGenre(genre);
                if (genre) showToast(`Filtered by ${genre}`);
              }}
              onSeeAll={() => {
                showToast('Browsing all 14 categories');
              }}
            />
          </div>
        </div>
      )}

      {/* SCREEN 2: LIBRARY SCREEN */}
      {activeTab === 'library' && (
        <div className="animate-in fade-in duration-150 flex-1 flex flex-col">
          <LibraryView
            documents={importedDocuments}
            onDocumentsChange={refreshDocuments}
            onOpenReader={(b) => setReadingBook(b)}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* SCREEN 3: NOTES & HIGHLIGHTS SCREEN */}
      {activeTab === 'notes' && (
        <div className="flex-1 px-5 pt-3 pb-6 flex flex-col justify-between animate-in fade-in duration-150">
          <div>
            <header className="flex items-center justify-between pt-1 pb-3">
              <div>
                <h1 className="font-serif-display font-bold text-[28px] text-stone-900 tracking-tight leading-none">
                  Notes & Highlights
                </h1>
                <p className="text-stone-500 text-[13px] font-normal mt-1 tabular-nums">
                  {allNotes.length} notes • {allHighlights.length} highlights • {allBookmarks.length} bookmarks
                </p>
              </div>
            </header>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-1 pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `All (${allHighlights.length + allNotes.length + allBookmarks.length})` },
                { id: 'highlights', label: `Highlights (${allHighlights.length})` },
                { id: 'notes', label: `Notes (${allNotes.length})` },
                { id: 'bookmarks', label: `Bookmarks (${allBookmarks.length})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setNotesFilter(pill.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    notesFilter === pill.id
                      ? 'bg-[#154D43] text-white shadow-2xs font-semibold'
                      : 'bg-[#EFEFEA] text-stone-600 hover:bg-[#E5E5DF]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* List of Annotations */}
            <div className="space-y-3 mt-2">
              {(notesFilter === 'all' || notesFilter === 'highlights') &&
                allHighlights.map((hl) => (
                  <div
                    key={hl.id}
                    onClick={() => handleOpenHighlightInReader(hl)}
                    className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#154D43] bg-teal-50 px-2 py-0.5 rounded-full">
                        Highlight
                      </span>
                    </div>
                    <p
                      className="text-xs font-medium text-stone-900 leading-relaxed p-2.5 rounded-xl border-l-3 border-[#154D43]"
                      style={{ backgroundColor: `${hl.colorHex || '#FEF08A'}55` }}
                    >
                      “{hl.text}”
                    </p>
                    {hl.note && (
                      <p className="text-[11px] text-stone-600 mt-1.5 px-1 italic">
                        Note: {hl.note}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 px-1">
                      <span className="font-medium text-stone-600 truncate max-w-[200px]">
                        Page {hl.page} • {hl.documentName}
                      </span>
                      <span className="text-[#154D43] font-bold group-hover:underline">
                        Jump to Page →
                      </span>
                    </div>
                  </div>
                ))}

              {(notesFilter === 'all' || notesFilter === 'notes') &&
                allNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() =>
                      handleOpenHighlightInReader({
                        documentId: note.documentId,
                        page: note.page,
                        documentName: note.documentName,
                      })
                    }
                    className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Note
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {note.selectedText && (
                      <div className="mb-2 p-2 rounded-xl bg-stone-50 border-l-2 border-[#154D43] text-[11px] italic text-stone-700">
                        “{note.selectedText}”
                      </div>
                    )}
                    <p className="text-xs font-medium text-stone-900 leading-relaxed px-1 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2.5 px-1 pt-1 border-t border-stone-100">
                      <span className="font-medium text-stone-600 truncate max-w-[200px]">
                        Page {note.page} • {note.documentName}
                      </span>
                      <span className="text-[#154D43] font-bold group-hover:underline">
                        Jump to Page →
                      </span>
                    </div>
                  </div>
                ))}

              {(notesFilter === 'all' || notesFilter === 'bookmarks') &&
                allBookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() =>
                      handleOpenHighlightInReader({
                        documentId: bm.documentId,
                        page: bm.page,
                        documentName: bm.documentName,
                      })
                    }
                    className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#154D43] flex items-center justify-center font-bold text-xs">
                        p.{bm.page}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900 truncate max-w-[200px]">
                          {bm.documentName}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Bookmarked Page {bm.page}
                        </div>
                      </div>
                    </div>
                    <span className="text-[#154D43] font-bold text-xs group-hover:underline">
                      Jump →
                    </span>
                  </div>
                ))}

              {((notesFilter === 'all' &&
                allHighlights.length === 0 &&
                allNotes.length === 0 &&
                allBookmarks.length === 0) ||
                (notesFilter === 'highlights' && allHighlights.length === 0) ||
                (notesFilter === 'notes' && allNotes.length === 0) ||
                (notesFilter === 'bookmarks' && allBookmarks.length === 0)) && (
                <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/80 p-6">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">
                    No {notesFilter === 'all' ? 'annotations' : notesFilter} yet
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 max-w-[220px] mx-auto">
                    Open any PDF or book to highlight passages, bookmark pages, and write notes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: COMMUNITY SCREEN */}
      {activeTab === 'community' && (
        <div className="flex-1 px-5 pt-3 pb-6 flex flex-col justify-between animate-in fade-in duration-150">
          <div>
            <header className="pt-1 pb-3">
              <h1 className="font-serif-display font-bold text-[28px] text-stone-900 tracking-tight leading-none">
                Community
              </h1>
              <p className="text-stone-500 text-[13px] font-normal mt-1">
                Reading clubs & discussions
              </p>
            </header>
            <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs mt-3">
              <span className="text-[10px] font-bold uppercase text-[#154D43] bg-teal-50 px-2 py-0.5 rounded-full">
                Weekly Discussion
              </span>
              <h4 className="font-bold text-stone-900 text-sm mt-2">
                The Psychology of Money • Chapter 2: The Power of Compounding
              </h4>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Join 1,240 readers discussing how time in the market beats timing the market.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Reader Modal */}
      {readingBook && (
        <ReaderModal
          key={readingBook.id}
          book={readingBook}
          onClose={() => {
            refreshDocuments();
            setReadingBook(null);
          }}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {/* Book Detail Sheet */}
      {selectedBookForDetails && (
        <BookDetailModal
          book={selectedBookForDetails}
          onClose={() => setSelectedBookForDetails(null)}
          onOpenReader={(b) => {
            setSelectedBookForDetails(null);
            setReadingBook(b);
          }}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          onClose={() => {
            setIsProfileOpen(false);
            if (activeTab === 'profile') {
              setActiveTab('home');
            }
          }}
        />
      )}
    </AndroidFrame>
  );
}
