export type HighlightColor = 'yellow' | 'teal' | 'rose' | 'blue' | 'purple';

export const PASTEL_COLORS: {
  id: HighlightColor;
  name: string;
  hex: string;
  bgClass: string;
}[] = [
  { id: 'yellow', name: 'Muted Lemon', hex: '#FEF08A', bgClass: 'vedora-hl-yellow' },
  { id: 'teal', name: 'Seafoam Teal', hex: '#99F6E4', bgClass: 'vedora-hl-teal' },
  { id: 'rose', name: 'Soft Rose', hex: '#FECDD3', bgClass: 'vedora-hl-rose' },
  { id: 'blue', name: 'Sky Blue', hex: '#BFDBFE', bgClass: 'vedora-hl-blue' },
  { id: 'purple', name: 'Lavender', hex: '#DDD6FE', bgClass: 'vedora-hl-purple' },
];

export interface HighlightRect {
  top: number; // percentage (0 to 100)
  left: number; // percentage (0 to 100)
  width: number; // percentage (0 to 100)
  height: number; // percentage (0 to 100)
}

export interface HighlightItem {
  id: string;
  documentId: string;
  text: string;
  color: HighlightColor;
  colorHex: string;
  page: number;
  rects?: HighlightRect[];
  createdAt: number;
  note?: string;
}

export interface NoteItem {
  id: string;
  documentId: string;
  documentName: string;
  page: number;
  content: string;
  selectedText?: string;
  createdAt: number;
  updatedAt: number;
  color?: HighlightColor;
}

export interface BookmarkItem {
  id: string;
  documentId: string;
  documentName: string;
  page: number;
  createdAt: number;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark';

export type ReaderViewMode = 'continuous' | 'single';

export interface Book {
  id: string;
  title: string;
  displayTitle?: string;
  fileName?: string;
  author: string;
  fileSize: string;
  fileType: 'PDF' | 'EPUB';
  progress: number; // 0 to 100
  totalPages: number;
  currentPage: number;
  coverVariant: 'psychology-of-money' | 'atomic-habits' | 'design-of-everyday-things' | 'laws-of-ux' | 'deep-work' | 'custom';
  coverBgColor?: string;
  genre: 'Self Help' | 'Business' | 'Design' | 'Tech';
  isFavorite?: boolean;
  notesCount?: number;
  highlightsCount?: number;
  lastOpened?: string;
  quote?: string;
  isImported?: boolean;
  blob?: Blob;
  pdfUrl?: string;
  error?: string;
}

export type TabType = 'home' | 'library' | 'notes' | 'community' | 'profile';

export type GenreType = 'Self Help' | 'Business' | 'Design' | 'Tech';
