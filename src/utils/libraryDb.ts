import { HighlightItem, NoteItem, BookmarkItem } from '../types';
import { loadPdfDocument } from './pdfRenderer';

export interface ImportedDocument {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  dateAdded: number; // timestamp
  lastOpened: number; // timestamp
  progress: number; // 0 to 100
  totalPages: number;
  currentPage: number;
  isFavorite: boolean;
  mimeType: string;
}

const DB_NAME = 'vedora_library_db';
const DB_VERSION = 1;
const BLOB_STORE = 'pdf_blobs';
const METADATA_KEY = 'vedora_imported_documents_v1';
const HIGHLIGHTS_PREFIX = 'vedora_highlights_doc_';
const BOOKMARKS_PREFIX = 'vedora_bookmark_doc_';
const NOTES_PREFIX = 'vedora_notes_doc_';
const PAGE_BOOKMARKS_PREFIX = 'vedora_page_bookmarks_doc_';

// Format bytes into human readable format
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Open IndexedDB database for Blob storage
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Load metadata list from localStorage
export function loadDocumentsMetadata(): ImportedDocument[] {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load documents metadata from localStorage:', err);
    return [];
  }
}

// Save metadata list to localStorage
export function saveDocumentsMetadata(docs: ImportedDocument[]): void {
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save documents metadata to localStorage:', err);
  }
}

const memoryBlobMap = new Map<string, Blob>();

// Store a PDF file in IndexedDB and persist its metadata
export async function storePdfDocument(file: File): Promise<ImportedDocument> {
  const id = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  let actualPages = 1;

  // Cache immediately in memory
  memoryBlobMap.set(id, file);

  try {
    const pdfDoc = await loadPdfDocument(file);
    actualPages = pdfDoc.numPages || 1;
  } catch (parseErr) {
    console.warn('Could not extract PDF page count eagerly, estimating:', parseErr);
    actualPages = Math.max(1, Math.min(999, Math.round(file.size / (100 * 1024)))) || 1;
  }

  const docMetadata: ImportedDocument = {
    id,
    name: file.name,
    size: file.size,
    formattedSize: formatBytes(file.size),
    dateAdded: now,
    lastOpened: now,
    progress: 0,
    totalPages: actualPages,
    currentPage: 1,
    isFavorite: false,
    mimeType: file.type || 'application/pdf',
  };

  // Store file blob in IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.put({ id, blob: file, name: file.name });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn('IndexedDB blob storage failed, continuing with metadata:', idbErr);
  }

  // Update metadata list in localStorage
  const current = loadDocumentsMetadata();
  const updated = [docMetadata, ...current];
  saveDocumentsMetadata(updated);

  return docMetadata;
}

// Retrieve PDF Blob from IndexedDB or memory cache with fallback for seeded test files
export async function getPdfBlob(id: string): Promise<Blob | null> {
  // 1. Check in-memory cache first
  if (memoryBlobMap.has(id)) {
    return memoryBlobMap.get(id) || null;
  }

  // 2. Query IndexedDB
  try {
    const db = await openDB();
    const blobFromDb = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });

    if (blobFromDb) {
      memoryBlobMap.set(id, blobFromDb);
      return blobFromDb;
    }
  } catch (err) {
    console.warn('IndexedDB lookup exception for blob:', err);
  }

  // 3. Fallback for built-in sample documents
  const docs = loadDocumentsMetadata();
  const doc = docs.find((d) => d.id === id);
  if (doc) {
    let fallbackPath: string | null = null;
    if (doc.name === 'Bhartiya_Kavya_Shastra_Hindi.pdf' || doc.name.includes('Hindi')) {
      fallbackPath = '/test_hindi.pdf';
    } else if (doc.name === 'test_alpha.pdf') {
      fallbackPath = '/test_alpha.pdf';
    } else if (doc.name === 'test_beta.pdf') {
      fallbackPath = '/test_beta.pdf';
    }

    if (fallbackPath) {
      try {
        const res = await fetch(fallbackPath);
        if (res.ok) {
          const blob = await res.blob();
          memoryBlobMap.set(id, blob);
          return blob;
        }
      } catch (fetchErr) {
        console.warn('Could not fetch fallback PDF asset:', fetchErr);
      }
    }
  }

  return null;
}

// Delete document from IndexedDB and metadata
export async function deletePdfDocument(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete blob from IndexedDB:', err);
  }

  // Clean up metadata
  const current = loadDocumentsMetadata();
  const filtered = current.filter((doc) => doc.id !== id);
  saveDocumentsMetadata(filtered);

  // Clean up document-specific highlights, bookmarks, and notes
  try {
    localStorage.removeItem(`${HIGHLIGHTS_PREFIX}${id}`);
    localStorage.removeItem(`${BOOKMARKS_PREFIX}${id}`);
    localStorage.removeItem(`${NOTES_PREFIX}${id}`);
    localStorage.removeItem(`${PAGE_BOOKMARKS_PREFIX}${id}`);
  } catch (e) {
    // Ignore storage cleanup errors
  }
}

// Update document progress & last opened
export function updateDocProgress(id: string, progress: number, currentPage?: number): void {
  const current = loadDocumentsMetadata();
  const updated = current.map((doc) => {
    if (doc.id === id) {
      const page = currentPage !== undefined ? currentPage : Math.max(1, Math.round((progress / 100) * doc.totalPages));
      return {
        ...doc,
        progress,
        currentPage: page,
        lastOpened: Date.now(),
      };
    }
    return doc;
  });
  saveDocumentsMetadata(updated);
}

// Toggle favorite on an imported document
export function toggleDocFavorite(id: string): boolean {
  const current = loadDocumentsMetadata();
  let nextState = false;
  const updated = current.map((doc) => {
    if (doc.id === id) {
      nextState = !doc.isFavorite;
      return { ...doc, isFavorite: nextState };
    }
    return doc;
  });
  saveDocumentsMetadata(updated);
  return nextState;
}

// Highlights persistence per document ID
export function loadDocHighlights(documentId: string): HighlightItem[] {
  try {
    const raw = localStorage.getItem(`${HIGHLIGHTS_PREFIX}${documentId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDocHighlights(documentId: string, items: HighlightItem[]): void {
  try {
    localStorage.setItem(`${HIGHLIGHTS_PREFIX}${documentId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save highlights:', err);
  }
}

// Retrieve all saved highlights across imported documents and books
export function getAllSavedHighlights(): Array<HighlightItem & { documentName: string }> {
  const docs = loadDocumentsMetadata();
  const allHighlights: Array<HighlightItem & { documentName: string }> = [];

  // From imported documents
  for (const doc of docs) {
    const highlights = loadDocHighlights(doc.id);
    for (const hl of highlights) {
      allHighlights.push({
        ...hl,
        documentName: doc.name,
      });
    }
  }

  // From sample books
  const sampleBookIds = [
    { id: 'psychology-of-money', name: 'The Psychology of Money' },
    { id: 'atomic-habits', name: 'Atomic Habits' },
    { id: 'design-of-everyday-things', name: 'The Design of Everyday Things' },
    { id: 'laws-of-ux', name: 'Laws of UX' },
  ];

  for (const sb of sampleBookIds) {
    const highlights = loadDocHighlights(sb.id);
    for (const hl of highlights) {
      allHighlights.push({
        ...hl,
        documentName: sb.name,
      });
    }
  }

  return allHighlights.sort((a, b) => b.createdAt - a.createdAt);
}

// Note management per document ID
export function loadDocNotes(documentId: string): NoteItem[] {
  try {
    const raw = localStorage.getItem(`${NOTES_PREFIX}${documentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDocNotes(documentId: string, notes: NoteItem[]): void {
  try {
    localStorage.setItem(`${NOTES_PREFIX}${documentId}`, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

export function getAllSavedNotes(): NoteItem[] {
  const docs = loadDocumentsMetadata();
  const allNotes: NoteItem[] = [];

  for (const doc of docs) {
    const notes = loadDocNotes(doc.id);
    for (const n of notes) {
      allNotes.push({
        ...n,
        documentName: doc.name,
      });
    }
  }

  const sampleBookIds = [
    { id: 'psychology-of-money', name: 'The Psychology of Money' },
    { id: 'atomic-habits', name: 'Atomic Habits' },
    { id: 'design-of-everyday-things', name: 'The Design of Everyday Things' },
    { id: 'laws-of-ux', name: 'Laws of UX' },
  ];

  for (const sb of sampleBookIds) {
    const notes = loadDocNotes(sb.id);
    for (const n of notes) {
      allNotes.push({
        ...n,
        documentName: sb.name,
      });
    }
  }

  return allNotes.sort((a, b) => b.createdAt - a.createdAt);
}

// Page bookmarks per document ID
export function loadDocBookmarkedPages(documentId: string): number[] {
  try {
    const raw = localStorage.getItem(`${PAGE_BOOKMARKS_PREFIX}${documentId}`);
    if (!raw) {
      const legacy = localStorage.getItem(`${BOOKMARKS_PREFIX}${documentId}`);
      if (legacy === 'true') {
        return [1];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDocBookmarkedPages(documentId: string, pages: number[]): void {
  try {
    localStorage.setItem(`${PAGE_BOOKMARKS_PREFIX}${documentId}`, JSON.stringify(pages));
    localStorage.setItem(`${BOOKMARKS_PREFIX}${documentId}`, String(pages.length > 0));
  } catch (err) {
    console.error('Failed to save page bookmarks:', err);
  }
}

export function isDocPageBookmarked(documentId: string, page: number): boolean {
  const pages = loadDocBookmarkedPages(documentId);
  return pages.includes(page);
}

export function toggleDocPageBookmark(documentId: string, page: number): boolean {
  const pages = loadDocBookmarkedPages(documentId);
  const exists = pages.includes(page);
  let updated: number[];
  if (exists) {
    updated = pages.filter((p) => p !== page);
  } else {
    updated = [...pages, page].sort((a, b) => a - b);
  }
  saveDocBookmarkedPages(documentId, updated);
  return !exists;
}

export function getAllSavedBookmarks(): BookmarkItem[] {
  const docs = loadDocumentsMetadata();
  const allBookmarks: BookmarkItem[] = [];

  for (const doc of docs) {
    const pages = loadDocBookmarkedPages(doc.id);
    for (const page of pages) {
      allBookmarks.push({
        id: `bm_${doc.id}_${page}`,
        documentId: doc.id,
        documentName: doc.name,
        page,
        createdAt: doc.lastOpened || doc.dateAdded,
      });
    }
  }

  const sampleBookIds = [
    { id: 'psychology-of-money', name: 'The Psychology of Money' },
    { id: 'atomic-habits', name: 'Atomic Habits' },
    { id: 'design-of-everyday-things', name: 'The Design of Everyday Things' },
    { id: 'laws-of-ux', name: 'Laws of UX' },
  ];

  for (const sb of sampleBookIds) {
    const pages = loadDocBookmarkedPages(sb.id);
    for (const page of pages) {
      allBookmarks.push({
        id: `bm_${sb.id}_${page}`,
        documentId: sb.id,
        documentName: sb.name,
        page,
        createdAt: Date.now(),
      });
    }
  }

  return allBookmarks;
}
