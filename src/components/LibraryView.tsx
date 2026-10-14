import React, { useState, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import {
  ImportedDocument,
  storePdfDocument,
  deletePdfDocument,
  toggleDocFavorite,
  getPdfBlob,
} from '../utils/libraryDb';
import { Book } from '../types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title_asc' | 'title_desc' | 'size'>('recent');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          await storePdfDocument(file);
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
      await storePdfDocument(file);
      onDocumentsChange();
      onShowToast(`Imported sample "${filename}"`);
    } catch (err: any) {
      console.error('Error loading sample test PDF:', err);
      onShowToast(`Failed to load test PDF: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteDoc = async (id: string, name: string) => {
    setActiveMenuDocId(null);
    await deletePdfDocument(id);
    onDocumentsChange();
    onShowToast(`Deleted "${name}"`);
  };

  const handleToggleFavorite = (id: string) => {
    const nextState = toggleDocFavorite(id);
    onDocumentsChange();
    onShowToast(nextState ? 'Added to Favorites' : 'Removed from Favorites');
  };

  const handleDownloadOriginal = async (doc: ImportedDocument) => {
    setActiveMenuDocId(null);
    const blob = await getPdfBlob(doc.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast(`Downloaded "${doc.name}"`);
    } else {
      onShowToast('Original PDF file is stored locally');
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

  const processedDocuments = useMemo(() => {
    let result = [...documents];
    if (activeFilter === 'favorites') {
      result = result.filter((d) => d.isFavorite);
    } else if (activeFilter === 'recent') {
      result = result.filter((d) => d.progress > 0 || Date.now() - d.lastOpened < 7 * 86400000);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }
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
  }, [documents, activeFilter, searchQuery, sortBy]);

  return (
    <div className="flex-1 px-4 sm:px-5 pt-3 pb-6 flex flex-col min-h-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf, .pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex-1 flex flex-col min-h-0">
        <header className="flex items-center justify-between pt-1 pb-3">
          <div>
            <h1 className="font-serif-display font-bold text-[28px] text-stone-900 tracking-tight leading-none">
              Library
            </h1>
            <p className="text-stone-500 text-[13px] font-normal mt-1 tracking-normal">
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
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isSortMenuOpen
                    ? 'bg-[#154D43] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
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
                  <div className="absolute right-0 top-12 z-40 bg-white rounded-2xl shadow-xl border border-stone-200/80 p-2 w-48 text-xs font-medium text-stone-700 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
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
                        className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                          sortBy === item.id
                            ? 'bg-[#154D43]/10 text-[#154D43] font-bold'
                            : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {sortBy === item.id && <span className="text-[#154D43]">✓</span>}
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#154D43] hover:bg-[#0E3A32] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Import PDF</span>
            </button>
          </div>
        </header>

        <div className="flex items-center gap-2 mt-1 pb-1">
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#154D43] text-white shadow-2xs'
                    : 'bg-[#EFEFEA] text-stone-600 hover:bg-[#E5E5DF] hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-[#EFEFEA] hover:bg-[#EBEBE5] focus-within:bg-[#E8E8E1] focus-within:ring-2 focus-within:ring-[#154D43]/20 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 transition-all">
            <Search className="w-[18px] h-[18px] text-stone-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in your library..."
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

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="w-11 h-11 rounded-2xl bg-[#EFEFEA] hover:bg-[#E8E8E1] flex items-center justify-center text-stone-600 transition-colors shrink-0 cursor-pointer"
            title={viewMode === 'list' ? 'Switch to Grid view' : 'Switch to List view'}
          >
            {viewMode === 'list' ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <ListIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {documents.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-3 px-1">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3 h-3 text-[#154D43]" />
              Sorted by:{' '}
              <strong className="text-stone-700">
                {sortBy === 'recent'
                  ? 'Recently Opened'
                  : sortBy === 'title_asc'
                  ? 'Title (A-Z)'
                  : sortBy === 'title_desc'
                  ? 'Title (Z-A)'
                  : 'File Size'}
              </strong>
            </span>
            <span className="tabular-nums font-medium">
              {processedDocuments.length} of {documents.length}
            </span>
          </div>
        )}

        <div className="mt-3">
          {documents.length === 0 ? (
            <div className="my-8 py-10 px-6 rounded-3xl border-2 border-dashed border-stone-300/80 bg-[#FAF8F5]/50 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#154D43]/10 text-[#154D43] flex items-center justify-center mb-4 shadow-inner">
                <UploadCloud className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="font-serif-display font-bold text-stone-900 text-lg">
                Your library is empty
              </h3>
              <p className="text-stone-500 text-xs mt-1.5 max-w-[260px] leading-relaxed">
                Import your PDF books, research papers, or study notes to read them on VEDORA.
              </p>
              <button
                type="button"
                onClick={handleTriggerImport}
                disabled={isImporting}
                className="mt-6 px-6 py-3 bg-[#154D43] hover:bg-[#0E3A32] active:scale-95 text-white text-xs font-semibold rounded-2xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isImporting ? 'Importing PDF...' : 'Import PDF'}</span>
              </button>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-stone-500 text-[11px]">
                <span className="text-stone-400">Quick tests:</span>
                <button
                  type="button"
                  onClick={() => handleLoadTestSample('alpha')}
                  disabled={isImporting}
                  className="font-medium text-[#154D43] hover:underline cursor-pointer"
                >
                  Test PDF A
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => handleLoadTestSample('beta')}
                  disabled={isImporting}
                  className="font-medium text-[#154D43] hover:underline cursor-pointer"
                >
                  Test PDF B
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => handleLoadTestSample('hindi')}
                  disabled={isImporting}
                  className="font-bold text-[#154D43] hover:underline cursor-pointer bg-[#154D43]/10 px-2 py-0.5 rounded-full"
                >
                  Hindi PDF (12 Pages)
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-3">
                PDFs are saved locally in your browser storage.
              </p>
            </div>
          ) : processedDocuments.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <FileText className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-semibold text-stone-800">No matching documents</p>
              <p className="text-xs text-stone-400 mt-1">
                No files found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-[#154D43] font-semibold hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2 mt-1">
              {processedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleReadDoc(doc)}
                  className="bg-white hover:bg-stone-50 border border-stone-200/70 rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer shadow-xs active:scale-[0.99] relative group"
                >
                  <div className="w-12 h-16 rounded-lg bg-stone-100 border border-stone-200 flex flex-col justify-between p-1.5 shrink-0 overflow-hidden shadow-2xs relative">
                    <span className="text-[7px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-1 py-0.2 rounded-xs self-start">
                      PDF
                    </span>
                    <FileText className="w-5 h-5 text-stone-400 mx-auto opacity-70" />
                    <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#154D43]"
                        style={{ width: `${doc.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-semibold text-stone-900 text-xs sm:text-[13px] leading-tight truncate group-hover:text-[#154D43] transition-colors">
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1">
                      <span>PDF</span>
                      <span>•</span>
                      <span>{doc.formattedSize}</span>
                      {doc.progress > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-[#154D43] tabular-nums">
                            {doc.progress}% read
                          </span>
                        </>
                      )}
                    </div>
                    {doc.progress > 0 && (
                      <div className="w-full max-w-[120px] h-1 bg-stone-100 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-[#154D43] rounded-full"
                          style={{ width: `${doc.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(doc.id);
                      }}
                      className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
                      title={doc.isFavorite ? 'Favorited' : 'Favorite'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          doc.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                        }}
                        className="p-2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                        title="Document options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenuDocId === doc.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuDocId(null);
                            }}
                          />
                          <div className="absolute right-0 top-8 z-40 bg-white rounded-2xl shadow-xl border border-stone-200/80 p-1.5 w-44 text-xs font-medium text-stone-700 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDocId(null);
                                handleReadDoc(doc);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 flex items-center gap-2 cursor-pointer text-stone-800"
                            >
                              <Play className="w-3.5 h-3.5 fill-stone-800" />
                              <span>Open Document</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadOriginal(doc);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 flex items-center gap-2 cursor-pointer text-stone-800"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save / Download</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoc(doc.id, doc.name);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete PDF</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-1">
              {processedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleReadDoc(doc)}
                  className="bg-white hover:bg-stone-50 border border-stone-200/70 rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer shadow-xs active:scale-[0.98] group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm">
                      PDF
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(doc.id);
                      }}
                      className="text-stone-300 hover:text-rose-500"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          doc.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <div className="my-4 text-center">
                    <FileText className="w-10 h-10 mx-auto text-stone-400 group-hover:text-[#154D43] transition-colors" />
                    <h4 className="font-semibold text-stone-900 text-xs mt-2 leading-tight line-clamp-2">
                      {doc.name}
                    </h4>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                      <span>{doc.formattedSize}</span>
                      <span className="font-semibold text-[#154D43]">
                        {doc.progress > 0 ? `${doc.progress}%` : ''}
                      </span>
                    </div>
                    {doc.progress > 0 && (
                      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-[#154D43]"
                          style={{ width: `${doc.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
