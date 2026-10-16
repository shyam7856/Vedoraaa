/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Bell, X, Sparkles, Plus, BookOpen, Trash2 } from 'lucide-react';
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
import { Book, GenreType, TabType } from './types';
import {
  ImportedDocument,
  loadDocumentsMetadata,
  updateDocProgress,
  getAllSavedHighlights,
  getAllSavedNotes,
  getAllSavedBookmarks,
  getPdfBlob,
  toggleDocFavorite,
  deleteDocHighlight,
  deleteDocNote,
} from './utils/libraryDb';
import { useTheme } from './utils/ThemeContext';

export default function App() {
  const { theme, isDark } = useTheme();
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

  // Load user imported documents from local storage
  const refreshDocuments = useCallback(() => {
    const docs = loadDocumentsMetadata();
    setImportedDocuments(docs);
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Map real user documents into Book models
  const userBooks: Book[] = useMemo(() => {
    return importedDocuments.map((doc) => ({
      id: doc.id,
      title: doc.name.replace(/\.pdf$/i, ''),
      displayTitle: doc.name,
      fileName: doc.name,
      author: 'Local Document',
      fileSize: doc.formattedSize,
      fileType: 'PDF' as const,
      progress: doc.progress || 0,
      totalPages: doc.totalPages || 1,
      currentPage: doc.currentPage || 1,
      coverVariant: 'custom' as const,
      genre: 'Tech' as const,
      isFavorite: doc.isFavorite,
      isImported: true,
    }));
  }, [importedDocuments]);

  // Compute all saved highlights, notes, and bookmarks across user documents
  const allHighlights = useMemo(() => {
    return getAllSavedHighlights();
  }, [importedDocuments, readingBook, activeTab]);

  const allNotes = useMemo(() => {
    return getAllSavedNotes();
  }, [importedDocuments, readingBook, activeTab]);

  const allBookmarks = useMemo(() => {
    return getAllSavedBookmarks();
  }, [importedDocuments, readingBook, activeTab]);

  const totalPagesCount = useMemo(() => {
    return importedDocuments.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
  }, [importedDocuments]);

  // Show transient toast
  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => {
      setActiveToast((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  // Open book in reader with its blob
  const handleOpenBook = async (book: Book, targetPage?: number) => {
    let blobToUse = book.blob;
    if (!blobToUse) {
      blobToUse = (await getPdfBlob(book.id)) || undefined;
    }
    if (!blobToUse) {
      showToast(`PDF file for "${book.fileName || book.title}" is missing from storage`);
      return;
    }

    setReadingBook({
      ...book,
      currentPage: targetPage || book.currentPage || 1,
      blob: blobToUse,
    });
  };

  // Open document at exact highlight page
  const handleOpenHighlightInReader = async (hl: { documentId: string; page: number; documentName?: string }) => {
    const doc = importedDocuments.find((d) => d.id === hl.documentId);
    if (!doc) {
      showToast('Document not found in storage');
      return;
    }
    const blob = await getPdfBlob(hl.documentId);
    if (!blob) {
      showToast('Document data missing from storage');
      return;
    }
    setReadingBook({
      id: doc.id,
      title: doc.name.replace(/\.pdf$/i, ''),
      displayTitle: doc.name,
      fileName: doc.name,
      author: 'Local Document',
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
  };

  // The primary "Continue Reading" book: most recently opened imported document
  const continueReadingBook = useMemo(() => {
    if (userBooks.length === 0) return null;
    const sorted = [...importedDocuments].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
    const mostRecentDoc = sorted[0];
    return userBooks.find((b) => b.id === mostRecentDoc.id) || userBooks[0];
  }, [userBooks, importedDocuments]);

  // Filter books based on search, genre, or favorites shortcut
  const filteredBooks = useMemo(() => {
    return userBooks.filter((book) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(query);
        const matchesFileName = (book.fileName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesFileName) return false;
      }
      if (activeShortcut === 'favorites' && !book.isFavorite) {
        return false;
      }
      return true;
    });
  }, [userBooks, searchQuery, activeShortcut]);

  // Toggle favorite status
  const handleToggleFavorite = (bookId: string) => {
    const nextFav = toggleDocFavorite(bookId);
    refreshDocuments();
    showToast(nextFav ? 'Added to Favorites' : 'Removed from Favorites');
  };

  // Update reading progress quietly
  const handleUpdateProgress = useCallback((bookId: string, progress: number, currentPage?: number) => {
    updateDocProgress(bookId, progress, currentPage);
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
      setNotesFilter('notes');
      showToast('Opening Notes');
    } else if (category === 'highlights') {
      setActiveTab('notes');
      setNotesFilter('highlights');
      showToast('Opening Highlights');
    }
  };

  // Android System Back Navigation (Requirement 3)
  useEffect(() => {
    (window as any).handleAndroidBack = () => {
      // 1. If Reader is open and has an active drawer/search/highlight modal
      if (typeof (window as any).__vedoraReaderBackHandler === 'function') {
        const readerHandled = (window as any).__vedoraReaderBackHandler();
        if (readerHandled) return true;
      }

      // 2. If Reader modal is open, close reader and return to library/home
      if (readingBook !== null) {
        setReadingBook(null);
        refreshDocuments();
        return true;
      }

      // 3. If any secondary dialog or detail sheet is open
      if (typeof (window as any).__vedoraProfileBackHandler === 'function') {
        const profileHandled = (window as any).__vedoraProfileBackHandler();
        if (profileHandled) return true;
      }
      if (selectedBookForDetails !== null) {
        setSelectedBookForDetails(null);
        return true;
      }
      if (isProfileOpen) {
        setIsProfileOpen(false);
        return true;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return true;
      }

      // 4. If on secondary tab (library, notes, community), return to home tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      // 5. App can exit
      return false;
    };

    return () => {
      delete (window as any).handleAndroidBack;
    };
  }, [readingBook, selectedBookForDetails, isProfileOpen, isNotificationsOpen, activeTab, refreshDocuments]);

  // Tab switching
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

      {/* FIXED APP LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* MAIN SCROLLABLE VIEW: Only this content area scrolls */}
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative flex flex-col">
          {/* SCREEN 1: HOME SCREEN */}
          {activeTab === 'home' && (
            <div className="flex-1 px-5 pt-3 pb-6 flex flex-col animate-in fade-in duration-150">
              <div>
                {/* Header Bar */}
                <header className="flex items-center justify-between pt-1 pb-3">
                  <div>
                    <h1
                      className="font-serif-display font-bold text-[28px] tracking-tight leading-none"
                      style={{ color: theme.textPrimary }}
                    >
                      VEDORA
                    </h1>
                    <p className="text-[13px] font-normal mt-1 tracking-normal" style={{ color: theme.textSecondary }}>
                      Your reading space
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(true)}
                      className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer relative"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: theme.textPrimary,
                      }}
                      aria-label="Notifications"
                    >
                      <Bell className="w-[20px] h-[20px] stroke-[1.9]" />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#FAF8F5] dark:ring-zinc-900" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(true)}
                      className="w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer font-serif-display"
                      style={{
                        backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                      }}
                      aria-label="Profile"
                    >
                      V
                    </button>
                  </div>
                </header>

                {/* Search Bar */}
                <div className="mt-2.5 relative">
                  <div
                    className="w-full rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 transition-all border"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <Search className="w-[18px] h-[18px] shrink-0" style={{ color: theme.textMuted }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your library..."
                      className="w-full bg-transparent text-[14px] outline-none font-normal"
                      style={{ color: theme.textPrimary }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 rounded-full cursor-pointer"
                        style={{ color: theme.textMuted }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filter Chips */}
                {(activeShortcut || searchQuery) && (
                  <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>Filtered by:</span>
                    {activeShortcut && (
                      <button
                        onClick={() => setActiveShortcut(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full cursor-pointer"
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          color: theme.textPrimary,
                        }}
                      >
                        <span className="capitalize">{activeShortcut}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full cursor-pointer"
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          color: theme.textPrimary,
                        }}
                      >
                        <span>"{searchQuery}"</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveShortcut(null);
                        setSearchQuery('');
                      }}
                      className="text-[10px] font-semibold hover:underline ml-1 cursor-pointer"
                      style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                    >
                      Reset
                    </button>
                  </div>
                )}

                {/* 1. Continue Reading Card (Only real user documents) */}
                {continueReadingBook ? (
                  <div className="mt-4">
                    <ContinueReadingCard
                      book={continueReadingBook}
                      onOpenReader={(b) => handleOpenBook(b)}
                      onOpenDetails={(b) => setSelectedBookForDetails(b)}
                    />
                  </div>
                ) : (
                  <div
                    className="mt-4 p-5 rounded-[26px] text-white shadow-sm flex flex-col items-start relative overflow-hidden"
                    style={{
                      backgroundColor: theme.brandPrimary,
                      boxShadow: `0 8px 24px -4px ${theme.brandPrimary}40`,
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs font-medium mb-1 text-white/80">
                      <BookOpen className="w-4 h-4 text-white/90" />
                      <span>Welcome to VEDORA</span>
                    </div>
                    <h3 className="font-serif-display font-bold text-lg text-white mt-1">
                      Your reading space is ready
                    </h3>
                    <p className="text-white/75 text-xs mt-1 leading-relaxed max-w-[280px]">
                      Import your PDF books, articles, or research papers to read, highlight, and take notes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('library')}
                      className="mt-4 px-4 py-2 bg-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      style={{ color: theme.brandPrimary }}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Open Library to Import</span>
                    </button>
                  </div>
                )}

                {/* 2. Recently Opened Carousel (Real user documents) */}
                {filteredBooks.length > 1 && continueReadingBook && (
                  <RecentlyOpened
                    books={filteredBooks.filter((b) => b.id !== continueReadingBook.id)}
                    onSelectBook={(book) => setSelectedBookForDetails(book)}
                    onSeeAll={() => {
                      setActiveTab('library');
                      showToast('Viewing Library');
                    }}
                  />
                )}

                {/* 3. Shortcut Tiles */}
                <ShortcutTiles
                  onSelectCategory={handleSelectShortcut}
                  activeCategory={activeShortcut}
                  counts={{
                    all: importedDocuments.length,
                    favorites: importedDocuments.filter((d) => d.isFavorite).length,
                    notes: allNotes.length,
                    highlights: allHighlights.length,
                  }}
                />
              </div>
            </div>
          )}

          {/* SCREEN 2: LIBRARY SCREEN */}
          {activeTab === 'library' && (
            <div className="animate-in fade-in duration-150 flex-1 flex flex-col min-h-0">
              <LibraryView
                documents={importedDocuments}
                onDocumentsChange={refreshDocuments}
                onOpenReader={(b) => handleOpenBook(b)}
                onShowToast={showToast}
              />
            </div>
          )}

          {/* SCREEN 3: NOTES & HIGHLIGHTS SCREEN */}
          {activeTab === 'notes' && (
            <div className="flex-1 px-5 pt-3 pb-6 flex flex-col animate-in fade-in duration-150">
              <div>
                <header className="flex items-center justify-between pt-1 pb-3">
                  <div>
                    <h1 className="font-serif-display font-bold text-[28px] tracking-tight leading-none" style={{ color: theme.textPrimary }}>
                      Notes & Highlights
                    </h1>
                    <p className="text-[13px] font-normal mt-1 tabular-nums" style={{ color: theme.textSecondary }}>
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
                  ].map((pill) => {
                    const isSelected = notesFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setNotesFilter(pill.id as any)}
                        className="px-3 py-1 rounded-full text-xs transition-colors cursor-pointer shrink-0 border"
                        style={{
                          backgroundColor: isSelected
                            ? isDark ? theme.secondary : theme.brandPrimary
                            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          color: isSelected ? '#FFFFFF' : theme.textSecondary,
                          borderColor: isSelected
                            ? isDark ? theme.mutedAccent : theme.brandPrimary
                            : theme.cardBorder,
                          fontWeight: isSelected ? 600 : 500,
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                {/* List of Annotations */}
                <div className="space-y-3 mt-2">
                  {(notesFilter === 'all' || notesFilter === 'highlights') &&
                    allHighlights.map((hl) => (
                      <div
                        key={hl.id}
                        className="p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow group border"
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                              color: isDark ? theme.mutedAccent : theme.brandPrimary,
                            }}
                          >
                            Highlight
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteDocHighlight(hl.documentId, hl.id);
                              refreshDocuments();
                              showToast('Deleted highlight');
                            }}
                            className="p-1 cursor-pointer transition-colors"
                            style={{ color: theme.textMuted }}
                            title="Delete highlight"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p
                          className="text-xs font-medium leading-relaxed p-2.5 rounded-xl border-l-3"
                          style={{
                            backgroundColor: `${hl.colorHex || '#FEF08A'}45`,
                            borderLeftColor: isDark ? theme.mutedAccent : theme.brandPrimary,
                            color: isDark ? '#F4F2EC' : '#1F1D1A',
                          }}
                        >
                          “{hl.text}”
                        </p>
                        {hl.note && (
                          <p className="text-[11px] mt-1.5 px-1 italic" style={{ color: theme.textSecondary }}>
                            Note: {hl.note}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] mt-2 px-1">
                          <span className="font-medium truncate max-w-[200px]" style={{ color: theme.textSecondary }}>
                            Page {hl.page} • {hl.documentName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenHighlightInReader(hl)}
                            className="font-bold hover:underline cursor-pointer"
                            style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                          >
                            Jump to Page →
                          </button>
                        </div>
                      </div>
                    ))}

                  {(notesFilter === 'all' || notesFilter === 'notes') &&
                    allNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow group border"
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                              color: isDark ? '#FCD34D' : '#B45309',
                            }}
                          >
                            Note
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: theme.textMuted }}>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteDocNote(note.documentId, note.id);
                                refreshDocuments();
                                showToast('Deleted note');
                              }}
                              className="p-1 cursor-pointer transition-colors"
                              style={{ color: theme.textMuted }}
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {note.selectedText && (
                          <div
                            className="mb-2 p-2 rounded-xl border-l-2 text-[11px] italic"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              borderLeftColor: isDark ? theme.mutedAccent : theme.brandPrimary,
                              color: theme.textSecondary,
                            }}
                          >
                            “{note.selectedText}”
                          </div>
                        )}
                        <p className="text-xs font-medium leading-relaxed px-1 whitespace-pre-wrap" style={{ color: theme.textPrimary }}>
                          {note.content}
                        </p>
                        <div
                          className="flex items-center justify-between text-[11px] mt-2.5 px-1 pt-1 border-t"
                          style={{ borderColor: theme.cardBorder }}
                        >
                          <span className="font-medium truncate max-w-[200px]" style={{ color: theme.textSecondary }}>
                            Page {note.page} • {note.documentName}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenHighlightInReader({
                                documentId: note.documentId,
                                page: note.page,
                                documentName: note.documentName,
                              })
                            }
                            className="font-bold hover:underline cursor-pointer"
                            style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                          >
                            Jump to Page →
                          </button>
                        </div>
                      </div>
                    ))}

                  {(notesFilter === 'all' || notesFilter === 'bookmarks') &&
                    allBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow group flex items-center justify-between border"
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                            style={{
                              backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                              color: isDark ? theme.mutedAccent : theme.brandPrimary,
                            }}
                          >
                            p.{bm.page}
                          </div>
                          <div>
                            <div className="text-xs font-semibold truncate max-w-[200px]" style={{ color: theme.textPrimary }}>
                              {bm.documentName}
                            </div>
                            <div className="text-[11px]" style={{ color: theme.textSecondary }}>
                              Bookmarked Page {bm.page}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenHighlightInReader({
                              documentId: bm.documentId,
                              page: bm.page,
                              documentName: bm.documentName,
                            })
                          }
                          className="font-bold text-xs hover:underline cursor-pointer"
                          style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                        >
                          Jump →
                        </button>
                      </div>
                    ))}

                  {((notesFilter === 'all' &&
                    allHighlights.length === 0 &&
                    allNotes.length === 0 &&
                    allBookmarks.length === 0) ||
                    (notesFilter === 'highlights' && allHighlights.length === 0) ||
                    (notesFilter === 'notes' && allNotes.length === 0) ||
                    (notesFilter === 'bookmarks' && allBookmarks.length === 0)) && (
                    <div
                      className="text-center py-12 rounded-3xl border p-6"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                      >
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                      <h4 className="text-xs font-bold" style={{ color: theme.textPrimary }}>
                        No {notesFilter === 'all' ? 'annotations' : notesFilter} yet
                      </h4>
                      <p className="text-[11px] mt-1 max-w-[220px] mx-auto" style={{ color: theme.textSecondary }}>
                        Open any PDF document to highlight passages, bookmark pages, and write notes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: COMMUNITY SCREEN */}
          {activeTab === 'community' && (
            <div className="flex-1 px-5 pt-3 pb-6 flex flex-col animate-in fade-in duration-150">
              <div>
                <header className="pt-1 pb-3">
                  <h1 className="font-serif-display font-bold text-[28px] tracking-tight leading-none" style={{ color: theme.textPrimary }}>
                    Community
                  </h1>
                  <p className="text-[13px] font-normal mt-1" style={{ color: theme.textSecondary }}>
                    Reading space & notes sharing
                  </p>
                </header>
                <div
                  className="p-4 rounded-2xl shadow-2xs mt-3 border"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                      color: isDark ? theme.mutedAccent : theme.brandPrimary,
                    }}
                  >
                    Offline Reading Space
                  </span>
                  <h4 className="font-bold text-sm mt-2" style={{ color: theme.textPrimary }}>
                    Markdown Export & Study Groups
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.textSecondary }}>
                    Export your notes and highlights as Markdown files from the document menu to share reading insights with your study circle.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* FIXED BOTTOM NAVIGATION: Outside of scrolling main view */}
        <footer className="shrink-0 z-30">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </footer>
      </div>

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
            handleOpenBook(b);
          }}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />
      )}

      {/* Profile Modal with real statistics and functional controls */}
      {isProfileOpen && (
        <ProfileModal
          onClose={() => {
            setIsProfileOpen(false);
            if (activeTab === 'profile') {
              setActiveTab('home');
            }
          }}
          documentsCount={importedDocuments.length}
          totalPagesCount={totalPagesCount}
          highlightsCount={allHighlights.length}
          notesCount={allNotes.length}
          bookmarksCount={allBookmarks.length}
          onShowToast={showToast}
        />
      )}
    </AndroidFrame>
  );
}
