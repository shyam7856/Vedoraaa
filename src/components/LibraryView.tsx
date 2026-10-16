import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  X,
  Play,
  Heart,
  MoreVertical,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Download,
  Folder,
  FolderPlus,
  FolderEdit,
  FolderOpen,
  FolderMinus,
  Check,
} from 'lucide-react';
import {
  ImportedDocument,
  LibraryFolder,
  storePdfDocument,
  deletePdfDocument,
  toggleDocFavorite,
  getPdfBlob,
  loadLibraryFolders,
  createLibraryFolder,
  renameLibraryFolder,
  deleteLibraryFolder,
  deleteLibraryFolderAndContents,
  moveDocToFolder,
} from '../utils/libraryDb';
import { Book } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface LibraryViewProps {
  documents: ImportedDocument[];
  onDocumentsChange: () => void;
  onOpenReader: (book: Book) => void;
  onShowToast: (message: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  onDocumentsChange,
  onOpenReader,
  onShowToast,
}) => {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title_asc' | 'title_desc' | 'size'>('recent');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safeguard against Android WebView ghost clicks (synthesized click after touch dismiss)
  const lastMenuActionTimeRef = useRef<number>(0);

  // Document action modals
  const [docToDelete, setDocToDelete] = useState<ImportedDocument | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [movingDoc, setMovingDoc] = useState<ImportedDocument | null>(null);
  const [pendingMoveDocId, setPendingMoveDocId] = useState<string | null>(null);

  // Folder state
  const [folders, setFolders] = useState<LibraryFolder[]>(() => loadLibraryFolders());
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<LibraryFolder | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<LibraryFolder | null>(null);

  const refreshFolders = () => {
    setFolders(loadLibraryFolders());
  };

  useEffect(() => {
    refreshFolders();
  }, []);

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    let importedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const stored = await storePdfDocument(file);
          if (activeFolderId && activeFolderId !== '__unfiled') {
            moveDocToFolder(stored.id, activeFolderId);
          }
          importedCount++;
        } catch (err) {
          console.error('Failed to import file:', file.name, err);
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsImporting(false);
    onDocumentsChange();

    if (importedCount > 0) {
      onShowToast(
        importedCount === 1
          ? `Imported "${files[0].name}"`
          : `Imported ${importedCount} PDF documents`
      );
    } else {
      onShowToast('Please select a valid PDF file');
    }
  };

  const handleLoadTestSample = async (variant: 'alpha' | 'beta' | 'hindi') => {
    setIsImporting(true);
    try {
      const filename =
        variant === 'alpha'
          ? 'test_alpha.pdf'
          : variant === 'beta'
          ? 'test_beta.pdf'
          : 'test_hindi.pdf';
      const response = await fetch(`/${filename}`);
      if (!response.ok) throw new Error(`Could not fetch /${filename}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'application/pdf' });
      const stored = await storePdfDocument(file);
      if (activeFolderId && activeFolderId !== '__unfiled') {
        moveDocToFolder(stored.id, activeFolderId);
      }
      onDocumentsChange();
      onShowToast(`Imported sample "${filename}"`);
    } catch (err: any) {
      console.error('Error loading sample test PDF:', err);
      onShowToast(`Failed to load test PDF: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Card click: blocks accidental activation if menu was just open or closed within 450ms
  const handleCardClick = (doc: ImportedDocument) => {
    if (activeMenuDocId) {
      setActiveMenuDocId(null);
      lastMenuActionTimeRef.current = Date.now();
      return;
    }
    if (Date.now() - lastMenuActionTimeRef.current < 450) {
      return; // Suppress Android WebView touch ghost click
    }
    handleReadDoc(doc);
  };

  // Toggle 3-dot menu on card
  const handleToggleMenu = (e: React.SyntheticEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    lastMenuActionTimeRef.current = Date.now();
    setActiveMenuDocId((prev) => (prev === docId ? null : docId));
  };

  // Dismiss menu without triggering background cards
  const handleDismissMenu = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    lastMenuActionTimeRef.current = Date.now();
    setActiveMenuDocId(null);
  };

  // Menu action wrapper
  const handleMenuAction = (e: React.SyntheticEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    lastMenuActionTimeRef.current = Date.now();
    setActiveMenuDocId(null);
    action();
  };

  // Confirmed deletion of single PDF document
  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    const doc = docToDelete;
    setIsDeletingDoc(true);
    try {
      await deletePdfDocument(doc.id);
      onDocumentsChange();
      onShowToast(`Deleted "${doc.name}"`);
    } catch (err) {
      console.error('Failed to delete document:', err);
      onShowToast(`Failed to delete "${doc.name}"`);
    } finally {
      setIsDeletingDoc(false);
      setDocToDelete(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const nextState = toggleDocFavorite(id);
    onDocumentsChange();
    onShowToast(nextState ? 'Added to Favorites' : 'Removed from Favorites');
  };

  // Android-compatible PDF Save / Download / Share
  const handleDownloadOriginal = async (doc: ImportedDocument) => {
    try {
      const blob = await getPdfBlob(doc.id);
      if (!blob) {
        onShowToast(`Could not export "${doc.name}": PDF file not found in storage.`);
        return;
      }

      const filename = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      // First check Web Share API with file support (first-class on Android WebView)
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: doc.name,
          });
          onShowToast(`Exported "${filename}"`);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return; // User cancelled Android share sheet
          }
        }
      }

      // Fallback: standard anchor blob download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1500);
      onShowToast(`Saved "${filename}"`);
    } catch (err) {
      console.error('Failed to save/download PDF:', err);
      onShowToast(`Failed to save "${doc.name}"`);
    }
  };

  const handleReadDoc = async (doc: ImportedDocument) => {
    try {
      const blob = await getPdfBlob(doc.id);
      if (!blob) {
        onShowToast(`Error: PDF data for "${doc.name}" is missing from storage.`);
        return;
      }
      const bookObj: Book = {
        id: doc.id,
        title: doc.name.replace(/\.pdf$/i, ''),
        displayTitle: doc.name,
        fileName: doc.name,
        author: 'Imported Document',
        fileSize: doc.formattedSize,
        fileType: 'PDF',
        progress: doc.progress,
        totalPages: doc.totalPages,
        currentPage: doc.currentPage || 1,
        coverVariant: 'custom',
        genre: 'Tech',
        isFavorite: doc.isFavorite,
        notesCount: 0,
        highlightsCount: 0,
        quote: `Reading imported document: ${doc.name}`,
        isImported: true,
        blob: blob,
      };
      onOpenReader(bookObj);
    } catch (err) {
      console.error('Error opening imported document:', err);
      onShowToast(`Error: Could not open "${doc.name}"`);
    }
  };

  // Folder handlers
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = createLibraryFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreateFolderOpen(false);
    refreshFolders();

    if (pendingMoveDocId) {
      moveDocToFolder(pendingMoveDocId, created.id);
      setPendingMoveDocId(null);
      onDocumentsChange();
      onShowToast(`Created "${created.name}" and moved document`);
    } else {
      setActiveFolderId(created.id);
      onShowToast(`Folder "${created.name}" created`);
    }
  };

  const handleSaveRenameFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editingFolderName.trim()) return;
    renameLibraryFolder(editingFolder.id, editingFolderName.trim());
    refreshFolders();
    onShowToast(`Folder renamed to "${editingFolderName.trim()}"`);
    setEditingFolder(null);
  };

  const handleConfirmDeleteFolderOnly = () => {
    if (!folderToDelete) return;
    const name = folderToDelete.name;
    deleteLibraryFolder(folderToDelete.id);
    if (activeFolderId === folderToDelete.id) {
      setActiveFolderId(null);
    }
    setFolderToDelete(null);
    refreshFolders();
    onDocumentsChange();
    onShowToast(`Folder "${name}" deleted (all documents preserved in Library)`);
  };

  const handleConfirmDeleteFolderAndContents = async () => {
    if (!folderToDelete) return;
    const name = folderToDelete.name;
    await deleteLibraryFolderAndContents(folderToDelete.id);
    if (activeFolderId === folderToDelete.id) {
      setActiveFolderId(null);
    }
    setFolderToDelete(null);
    refreshFolders();
    onDocumentsChange();
    onShowToast(`Folder "${name}" and all contents deleted`);
  };

  const handleMoveDocToFolder = (docId: string, targetFolderId: string | null) => {
    moveDocToFolder(docId, targetFolderId);
    setMovingDoc(null);
    onDocumentsChange();
    const folderName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name || 'Folder'
      : 'Unfiled';
    onShowToast(`Moved to "${folderName}"`);
  };

  // Process and filter documents
  const processedDocuments = useMemo(() => {
    let result = [...documents];

    // Filter by favorite / recent tabs
    if (activeFilter === 'favorites') {
      result = result.filter((d) => d.isFavorite);
    } else if (activeFilter === 'recent') {
      result = result.filter((d) => d.progress > 0 || Date.now() - d.lastOpened < 7 * 86400000);
    }

    // Filter by Folder
    if (activeFolderId === '__unfiled') {
      result = result.filter((d) => !d.folderId);
    } else if (activeFolderId) {
      result = result.filter((d) => d.folderId === activeFolderId);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }

    // Sort order
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.lastOpened - a.lastOpened;
        case 'title_asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'title_desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return result;
  }, [documents, activeFilter, activeFolderId, searchQuery, sortBy]);

  const activeFolderName = activeFolderId
    ? activeFolderId === '__unfiled'
      ? 'Unfiled'
      : folders.find((f) => f.id === activeFolderId)?.name || 'Folder'
    : 'All Documents';

  // Render the card's 3-dot dropdown menu
  const renderCardMenu = (doc: ImportedDocument) => {
    if (activeMenuDocId !== doc.id) return null;
    return (
      <>
        {/* Full-screen touch backdrop */}
        <div
          className="fixed inset-0 z-40"
          onPointerDown={handleDismissMenu}
          onTouchStart={handleDismissMenu}
          onClick={handleDismissMenu}
        />
        {/* Menu overlay positioned above card */}
        <div
          className="absolute right-0 top-9 z-50 rounded-2xl shadow-xl border p-1.5 w-44 text-xs font-medium animate-in fade-in zoom-in-95 duration-100 select-none"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
            color: theme.textPrimary,
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => handleMenuAction(e, () => handleReadDoc(doc))}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors active:scale-[0.98]"
            style={{ color: theme.textPrimary }}
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Open Document</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleMenuAction(e, () => setMovingDoc(doc))}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors active:scale-[0.98]"
            style={{ color: theme.textPrimary }}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
            <span>Move to Folder...</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleMenuAction(e, () => handleDownloadOriginal(doc))}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors active:scale-[0.98]"
            style={{ color: theme.textPrimary }}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Save / Download</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleMenuAction(e, () => setDocToDelete(doc))}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 flex items-center gap-2.5 cursor-pointer active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Delete PDF</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className="flex-1 px-4 sm:px-5 pt-3 pb-6 flex flex-col min-h-0 select-none ui-non-selectable"
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf, .pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with Title, Sort & Import button */}
        <header className="flex items-center justify-between pt-1 pb-2.5 select-none">
          <div>
            <h1 className="font-serif-display font-bold text-[28px] tracking-tight leading-none" style={{ color: theme.textPrimary }}>
              Library
            </h1>
            <p className="text-[13px] font-normal mt-1 tracking-normal" style={{ color: theme.textSecondary }}>
              {documents.length === 1
                ? '1 document stored'
                : `${documents.length} documents stored`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer border active:scale-95"
                style={{
                  backgroundColor: isSortMenuOpen
                    ? isDark ? theme.secondary : theme.brandPrimary
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: isSortMenuOpen ? '#FFFFFF' : theme.textPrimary,
                  borderColor: theme.cardBorder,
                }}
                title="Sort options"
                aria-label="Sort options"
              >
                <SlidersHorizontal className="w-[18px] h-[18px]" />
              </button>
              {isSortMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSortMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-12 z-40 rounded-2xl shadow-xl border p-2 w-48 text-xs font-medium animate-in fade-in zoom-in-95 duration-150 select-none"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    }}
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.textMuted }}>
                      Sort Documents By
                    </div>
                    {[
                      { id: 'recent', label: 'Recently Opened' },
                      { id: 'title_asc', label: 'Title (A to Z)' },
                      { id: 'title_desc', label: 'Title (Z to A)' },
                      { id: 'size', label: 'File Size' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSortBy(item.id as any);
                          setIsSortMenuOpen(false);
                          onShowToast(`Sorted by ${item.label}`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        style={{
                          backgroundColor: sortBy === item.id
                            ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`
                            : 'transparent',
                          color: sortBy === item.id
                            ? isDark ? theme.mutedAccent : theme.brandPrimary
                            : theme.textPrimary,
                          fontWeight: sortBy === item.id ? 700 : 500,
                        }}
                      >
                        <span>{item.label}</span>
                        {sortBy === item.id && <span style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleTriggerImport}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              style={{
                backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Import PDF</span>
            </button>
          </div>
        </header>

        {/* Status Filters: All, Recent, Favorites */}
        <div className="flex items-center gap-2 mt-0.5 pb-1 select-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'recent', label: 'Recent' },
            { id: 'favorites', label: 'Favorites' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border"
                style={{
                  backgroundColor: isActive
                    ? isDark ? theme.secondary : theme.brandPrimary
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: isActive ? '#FFFFFF' : theme.textSecondary,
                  borderColor: isActive
                    ? isDark ? theme.mutedAccent : theme.brandPrimary
                    : theme.cardBorder,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* FOLDERS ROW */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar select-none">
          {/* All Folders Chip */}
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border active:scale-95"
            style={{
              backgroundColor: activeFolderId === null
                ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`
                : theme.cardBg,
              borderColor: activeFolderId === null
                ? isDark ? theme.mutedAccent : theme.brandPrimary
                : theme.cardBorder,
              color: activeFolderId === null
                ? isDark ? theme.mutedAccent : theme.brandPrimary
                : theme.textSecondary,
              fontWeight: activeFolderId === null ? 700 : 500,
            }}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>All Folders</span>
            <span className="text-[10px] opacity-70 tabular-nums">({documents.length})</span>
          </button>

          {/* User Folders */}
          {folders.map((f) => {
            const isSelected = activeFolderId === f.id;
            const count = documents.filter((d) => d.folderId === f.id).length;
            return (
              <div key={f.id} className="relative flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(isSelected ? null : f.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95"
                  style={{
                    backgroundColor: isSelected
                      ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`
                      : theme.cardBg,
                    borderColor: isSelected
                      ? isDark ? theme.mutedAccent : theme.brandPrimary
                      : theme.cardBorder,
                    color: isSelected
                      ? isDark ? theme.mutedAccent : theme.brandPrimary
                      : theme.textSecondary,
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  <Folder className="w-3.5 h-3.5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
                  <span>{f.name}</span>
                  <span className="text-[10px] opacity-70 tabular-nums">({count})</span>
                </button>

                {/* Folder options button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFolderMenuId(folderMenuId === f.id ? null : f.id);
                  }}
                  className="p-1 -ml-1 transition-colors cursor-pointer rounded-lg"
                  style={{ color: theme.textMuted }}
                  title="Folder options"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>

                {folderMenuId === f.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFolderMenuId(null);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFolderMenuId(null);
                      }}
                    />
                    <div
                      className="absolute left-0 top-9 z-40 rounded-2xl shadow-xl border p-1.5 w-36 text-xs animate-in fade-in duration-100 select-none"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                        color: theme.textPrimary,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFolderMenuId(null);
                          setEditingFolder(f);
                          setEditingFolderName(f.name);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                        style={{ color: theme.textPrimary }}
                      >
                        <FolderEdit className="w-3.5 h-3.5" style={{ color: theme.textSecondary }} />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFolderMenuId(null);
                          setFolderToDelete(f);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Unfiled Chip */}
          {documents.some((d) => !d.folderId) && (
            <button
              type="button"
              onClick={() => setActiveFolderId(activeFolderId === '__unfiled' ? null : '__unfiled')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border active:scale-95"
              style={{
                backgroundColor: activeFolderId === '__unfiled'
                  ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`
                  : theme.cardBg,
                borderColor: activeFolderId === '__unfiled'
                  ? isDark ? theme.mutedAccent : theme.brandPrimary
                  : theme.cardBorder,
                color: activeFolderId === '__unfiled'
                  ? isDark ? theme.mutedAccent : theme.brandPrimary
                  : theme.textSecondary,
                fontWeight: activeFolderId === '__unfiled' ? 700 : 500,
              }}
            >
              <FolderMinus className="w-3.5 h-3.5" />
              <span>Unfiled</span>
              <span className="text-[10px] opacity-70 tabular-nums">
                ({documents.filter((d) => !d.folderId).length})
              </span>
            </button>
          )}

          {/* Create Folder Button */}
          <button
            type="button"
            onClick={() => setIsCreateFolderOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-dashed flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95"
            style={{
              borderColor: isDark ? `${theme.mutedAccent}60` : `${theme.brandPrimary}50`,
              color: isDark ? theme.mutedAccent : theme.brandPrimary,
              backgroundColor: isDark ? `${theme.secondary}15` : `${theme.brandPrimary}08`,
            }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create Folder</span>
          </button>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="mt-2.5 flex items-center gap-2">
          <div
            className="flex-1 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 transition-all border"
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
              placeholder={`Search in ${activeFolderName}...`}
              className="w-full bg-transparent text-[14px] outline-none font-normal selectable-text"
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

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 cursor-pointer border active:scale-95"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            }}
            title={viewMode === 'list' ? 'Switch to Grid view' : 'Switch to List view'}
            aria-label={viewMode === 'list' ? 'Switch to Grid view' : 'Switch to List view'}
          >
            {viewMode === 'list' ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <ListIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Status / Count bar */}
        {documents.length > 0 && (
          <div className="flex items-center justify-between text-[11px] mt-2.5 px-1 select-none" style={{ color: theme.textSecondary }}>
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3 h-3" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
              <span>Folder: <strong style={{ color: theme.textPrimary }}>{activeFolderName}</strong></span>
            </span>
            <span className="tabular-nums font-medium">
              {processedDocuments.length} of {documents.length}
            </span>
          </div>
        )}

        {/* Document List / Grid Area */}
        <div className="mt-2.5 flex-1 min-h-0 overflow-y-auto no-scrollbar select-none">
          {documents.length === 0 ? (
            <div
              className="my-6 py-8 px-6 rounded-3xl border-2 border-dashed flex flex-col items-center text-center select-none"
              style={{
                borderColor: theme.cardBorder,
                backgroundColor: theme.cardBg,
              }}
            >
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-inner"
                style={{
                  backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                  color: isDark ? theme.mutedAccent : theme.brandPrimary,
                }}
              >
                <UploadCloud className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="font-serif-display font-bold text-lg" style={{ color: theme.textPrimary }}>
                Your library is empty
              </h3>
              <p className="text-xs mt-1.5 max-w-[260px] leading-relaxed" style={{ color: theme.textSecondary }}>
                Import your PDF books, research papers, or study notes to read them on VEDORA.
              </p>
              <button
                type="button"
                onClick={handleTriggerImport}
                disabled={isImporting}
                className="mt-6 px-6 py-3 text-white text-xs font-semibold rounded-2xl shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                }}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isImporting ? 'Importing PDF...' : 'Import PDF'}</span>
              </button>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px]" style={{ color: theme.textSecondary }}>
                <span style={{ color: theme.textMuted }}>Quick tests:</span>
                <button
                  type="button"
                  onClick={() => handleLoadTestSample('alpha')}
                  disabled={isImporting}
                  className="font-medium hover:underline cursor-pointer"
                  style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                >
                  Test PDF A
                </button>
                <span style={{ color: theme.textMuted }}>•</span>
                <button
                  type="button"
                  onClick={() => handleLoadTestSample('beta')}
                  disabled={isImporting}
                  className="font-medium hover:underline cursor-pointer"
                  style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                >
                  Test PDF B
                </button>
                <span style={{ color: theme.textMuted }}>•</span>
                <button
                  type="button"
                  onClick={() => handleLoadTestSample('hindi')}
                  disabled={isImporting}
                  className="font-bold hover:underline cursor-pointer px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                    color: isDark ? theme.mutedAccent : theme.brandPrimary,
                  }}
                >
                  Hindi PDF (12 Pages)
                </button>
              </div>
            </div>
          ) : processedDocuments.length === 0 ? (
            <div className="py-12 text-center select-none" style={{ color: theme.textSecondary }}>
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: theme.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>No matching documents</p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                {searchQuery
                  ? `No files found matching "${searchQuery}" in ${activeFolderName}`
                  : `No files currently in ${activeFolderName}`}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                >
                  Clear search
                </button>
              ) : (
                <button
                  onClick={() => setActiveFolderId(null)}
                  className="mt-3 text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                >
                  Show all documents
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            /* LIST VIEW */
            <div className="space-y-2 pb-6 select-none">
              {processedDocuments.map((doc) => {
                const folder = folders.find((f) => f.id === doc.folderId);
                const isMenuOpen = activeMenuDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleCardClick(doc)}
                    className="library-card border rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer shadow-xs active:scale-[0.99] relative group select-none"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                      zIndex: isMenuOpen ? 40 : 1,
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      WebkitTouchCallout: 'none',
                    }}
                  >
                    <div
                      className="w-12 h-16 rounded-lg border flex flex-col justify-between p-1.5 shrink-0 overflow-hidden shadow-2xs relative select-none"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F2EFE9',
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <span className="text-[7px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2 rounded-xs self-start">
                        PDF
                      </span>
                      <FileText className="w-5 h-5 mx-auto opacity-70" style={{ color: theme.textMuted }} />
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${doc.progress}%`,
                            backgroundColor: isDark ? theme.mutedAccent : theme.brandPrimary,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <h4
                        className="font-semibold text-xs sm:text-[13px] leading-tight truncate transition-colors select-none"
                        style={{ color: theme.textPrimary }}
                      >
                        {doc.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] mt-1 flex-wrap select-none" style={{ color: theme.textSecondary }}>
                        <span className="select-none">{doc.formattedSize}</span>
                        {folder && (
                          <>
                            <span>•</span>
                            <span
                              className="inline-flex items-center gap-1 font-medium px-1.5 py-0.5 rounded-md select-none"
                              style={{
                                backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                                color: isDark ? theme.mutedAccent : theme.brandPrimary,
                              }}
                            >
                              <Folder className="w-2.5 h-2.5" />
                              <span>{folder.name}</span>
                            </span>
                          </>
                        )}
                        {doc.progress > 0 && (
                          <>
                            <span>•</span>
                            <span
                              className="font-semibold tabular-nums select-none"
                              style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
                            >
                              {doc.progress}% read
                            </span>
                          </>
                        )}
                      </div>
                      {doc.progress > 0 && (
                        <div
                          className="w-full max-w-[120px] h-1 rounded-full overflow-hidden mt-1.5 select-none"
                          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${doc.progress}%`,
                              backgroundColor: isDark ? theme.mutedAccent : theme.brandPrimary,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFavorite(doc.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-2 transition-colors cursor-pointer rounded-lg active:scale-95"
                        style={{ color: doc.isFavorite ? '#E11D48' : theme.textMuted }}
                        title={doc.isFavorite ? 'Favorited' : 'Favorite'}
                        aria-label={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            doc.isFavorite ? 'fill-[#E11D48]' : ''
                          }`}
                        />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, doc.id)}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="p-2 transition-colors cursor-pointer rounded-lg active:scale-95"
                          style={{ color: isMenuOpen ? (isDark ? theme.mutedAccent : theme.brandPrimary) : theme.textMuted }}
                          title="Document options"
                          aria-label={`Options for ${doc.name}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {renderCardMenu(doc)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-2 gap-3 pb-6 select-none">
              {processedDocuments.map((doc) => {
                const folder = folders.find((f) => f.id === doc.folderId);
                const isMenuOpen = activeMenuDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleCardClick(doc)}
                    className="library-card border rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer shadow-xs active:scale-[0.98] group relative select-none"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                      zIndex: isMenuOpen ? 40 : 1,
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      WebkitTouchCallout: 'none',
                    }}
                  >
                    <div className="flex items-start justify-between select-none">
                      <span className="text-[8px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-xs select-none">
                        PDF
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleFavorite(doc.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="p-1.5 transition-colors cursor-pointer rounded-lg active:scale-95"
                          style={{ color: doc.isFavorite ? '#E11D48' : theme.textMuted }}
                          title={doc.isFavorite ? 'Favorited' : 'Favorite'}
                          aria-label={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              doc.isFavorite ? 'fill-[#E11D48]' : ''
                            }`}
                          />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, doc.id)}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="p-1.5 transition-colors cursor-pointer rounded-lg active:scale-95"
                            style={{ color: isMenuOpen ? (isDark ? theme.mutedAccent : theme.brandPrimary) : theme.textMuted }}
                            title="Document options"
                            aria-label={`Options for ${doc.name}`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {renderCardMenu(doc)}
                        </div>
                      </div>
                    </div>

                    <div className="my-4 text-center select-none">
                      <FileText className="w-10 h-10 mx-auto transition-colors opacity-75" style={{ color: theme.textMuted }} />
                      <h4
                        className="font-semibold text-xs mt-2 leading-tight line-clamp-2 select-none"
                        style={{ color: theme.textPrimary }}
                      >
                        {doc.name}
                      </h4>
                      {folder && (
                        <span
                          className="inline-block text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-md truncate max-w-full select-none"
                          style={{
                            backgroundColor: isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`,
                            color: isDark ? theme.mutedAccent : theme.brandPrimary,
                          }}
                        >
                          {folder.name}
                        </span>
                      )}
                    </div>

                    <div className="select-none">
                      <div className="flex items-center justify-between text-[10px] font-medium select-none" style={{ color: theme.textMuted }}>
                        <span className="select-none">{doc.formattedSize}</span>
                        <span className="font-semibold select-none" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}>
                          {doc.progress > 0 ? `${doc.progress}%` : ''}
                        </span>
                      </div>
                      {doc.progress > 0 && (
                        <div
                          className="w-full h-1 rounded-full overflow-hidden mt-1.5 select-none"
                          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${doc.progress}%`,
                              backgroundColor: isDark ? theme.mutedAccent : theme.brandPrimary,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM DELETE DOCUMENT MODAL */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150 select-none"
          onClick={() => {
            if (!isDeletingDoc) setDocToDelete(null);
          }}
        >
          <div
            className="rounded-3xl p-5 max-w-sm w-full shadow-2xl border animate-in zoom-in-95 space-y-4"
            style={{
              backgroundColor: theme.bg,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: theme.cardBorder }}>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif-display font-bold text-sm sm:text-base leading-tight" style={{ color: theme.textPrimary }}>
                  Delete Document
                </h3>
                <p className="text-[11px] truncate mt-0.5" style={{ color: theme.textSecondary }}>
                  Remove from your Library
                </p>
              </div>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={() => setDocToDelete(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: theme.textPrimary,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              <p>
                Are you sure you want to remove <strong style={{ color: theme.textPrimary }}>"{docToDelete.name}"</strong> ({docToDelete.formattedSize})?
              </p>
              <p
                className="text-[11px] p-2.5 rounded-xl border leading-normal"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  color: theme.textSecondary,
                }}
              >
                This will remove the document and clear any associated reading progress, bookmarks, and highlights. The original file on your device is not modified.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: theme.cardBorder }}>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                style={{ color: theme.textSecondary }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={handleConfirmDeleteDoc}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingDoc ? 'Deleting...' : 'Delete PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isCreateFolderOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-in fade-in duration-150 select-none"
          onClick={() => {
            setIsCreateFolderOpen(false);
            setPendingMoveDocId(null);
          }}
        >
          <div
            className="rounded-3xl p-5 max-w-xs w-full shadow-2xl border animate-in zoom-in-95"
            style={{
              backgroundColor: theme.bg,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
              <div>
                <h3 className="font-serif-display font-bold text-sm" style={{ color: theme.textPrimary }}>
                  Create Library Folder
                </h3>
                {pendingMoveDocId && (
                  <p className="text-[10px] mt-0.5" style={{ color: theme.textSecondary }}>
                    Document will be moved here automatically
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateFolderOpen(false);
                  setPendingMoveDocId(null);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: theme.textPrimary,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="mt-3.5 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: theme.textSecondary }}>
                  Folder Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Philosophy, Science, Novel..."
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors selectable-text"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.cardBorder,
                    color: theme.textPrimary,
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: theme.cardBorder }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateFolderOpen(false);
                    setPendingMoveDocId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 cursor-pointer shadow-xs active:scale-95 transition-all"
                  style={{
                    backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME FOLDER MODAL */}
      {editingFolder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setEditingFolder(null)}
        >
          <div
            className="rounded-3xl p-5 max-w-xs w-full shadow-2xl border animate-in zoom-in-95"
            style={{
              backgroundColor: theme.bg,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
              <h3 className="font-serif-display font-bold text-sm" style={{ color: theme.textPrimary }}>
                Rename Folder
              </h3>
              <button
                type="button"
                onClick={() => setEditingFolder(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: theme.textPrimary,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleSaveRenameFolder} className="mt-3.5 space-y-3">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors selectable-text"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.cardBorder,
                    color: theme.textPrimary,
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: theme.cardBorder }}>
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingFolderName.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 cursor-pointer shadow-xs active:scale-95 transition-all"
                  style={{
                    backgroundColor: isDark ? theme.secondary : theme.brandPrimary,
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE DOCUMENT TO FOLDER MODAL */}
      {movingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setMovingDoc(null)}
        >
          <div
            className="rounded-3xl p-5 max-w-xs w-full shadow-2xl border animate-in zoom-in-95 space-y-3 select-none"
            style={{
              backgroundColor: theme.bg,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.cardBorder }}>
              <div className="min-w-0 pr-2">
                <h3 className="font-serif-display font-bold text-sm" style={{ color: theme.textPrimary }}>
                  Move to Folder
                </h3>
                <p className="text-[11px] truncate max-w-[200px]" style={{ color: theme.textSecondary }}>
                  {movingDoc.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovingDoc(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: theme.textPrimary,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 no-scrollbar">
              {/* Option: Unfiled */}
              <button
                type="button"
                onClick={() => handleMoveDocToFolder(movingDoc.id, null)}
                className="w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors text-xs cursor-pointer active:scale-[0.98]"
                style={{
                  backgroundColor: !movingDoc.folderId
                    ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`
                    : theme.cardBg,
                  borderColor: !movingDoc.folderId
                    ? isDark ? theme.mutedAccent : theme.brandPrimary
                    : theme.cardBorder,
                  color: !movingDoc.folderId
                    ? isDark ? theme.mutedAccent : theme.brandPrimary
                    : theme.textPrimary,
                  fontWeight: !movingDoc.folderId ? 700 : 500,
                }}
              >
                <span className="flex items-center gap-2">
                  <FolderMinus className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
                  <span>Unfiled (No folder)</span>
                </span>
                {!movingDoc.folderId && <Check className="w-3.5 h-3.5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />}
              </button>

              {/* Option: Each Folder */}
              {folders.map((f) => {
                const isCur = movingDoc.folderId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleMoveDocToFolder(movingDoc.id, f.id)}
                    className="w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors text-xs cursor-pointer active:scale-[0.98]"
                    style={{
                      backgroundColor: isCur
                        ? isDark ? `${theme.secondary}30` : `${theme.brandPrimary}15`
                        : theme.cardBg,
                      borderColor: isCur
                        ? isDark ? theme.mutedAccent : theme.brandPrimary
                        : theme.cardBorder,
                      color: isCur
                        ? isDark ? theme.mutedAccent : theme.brandPrimary
                        : theme.textPrimary,
                      fontWeight: isCur ? 700 : 500,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />
                      <span>{f.name}</span>
                    </span>
                    {isCur && <Check className="w-3.5 h-3.5" style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }} />}
                  </button>
                );
              })}

              {folders.length === 0 && (
                <p className="text-center text-xs py-3" style={{ color: theme.textMuted }}>
                  No folders created yet.
                </p>
              )}
            </div>

            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: theme.cardBorder }}>
              <button
                type="button"
                onClick={() => {
                  const doc = movingDoc;
                  setMovingDoc(null);
                  if (doc) {
                    setPendingMoveDocId(doc.id);
                  }
                  setIsCreateFolderOpen(true);
                }}
                className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: isDark ? theme.mutedAccent : theme.brandPrimary }}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>
              <button
                type="button"
                onClick={() => setMovingDoc(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                style={{ color: theme.textSecondary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE FOLDER CONFIRMATION MODAL */}
      {folderToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setFolderToDelete(null)}
        >
          <div
            className="rounded-3xl p-5 max-w-sm w-full shadow-2xl border animate-in zoom-in-95 space-y-4"
            style={{
              backgroundColor: theme.bg,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.cardBorder }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-serif-display font-bold text-sm" style={{ color: theme.textPrimary }}>
                  Delete Folder
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: theme.textPrimary,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              How would you like to delete <strong style={{ color: theme.textPrimary }}>"{folderToDelete.name}"</strong>?
              {documents.filter((d) => d.folderId === folderToDelete.id).length > 0 && (
                <span className="block mt-1">
                  This folder currently contains{' '}
                  <span className="font-semibold" style={{ color: theme.textPrimary }}>
                    {documents.filter((d) => d.folderId === folderToDelete.id).length} document(s)
                  </span>.
                </span>
              )}
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDeleteFolderOnly}
                className="w-full p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-[0.99]"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <div className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
                  Remove Folder Only
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: theme.textSecondary }}>
                  Keep all PDF documents safely in your Library as unfiled
                </div>
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteFolderAndContents}
                className="w-full p-3 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Remove Folder and All Contents
                </div>
                <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  Permanently delete this folder and all documents inside it
                </div>
              </button>
            </div>

            <div className="pt-2 border-t flex justify-end" style={{ borderColor: theme.cardBorder }}>
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                style={{ color: theme.textSecondary }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
