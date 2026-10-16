export type HighlightColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'teal' | 'rose';

export const PASTEL_COLORS: {
  id: HighlightColor;
  name: string;
  hex: string;
  bgClass: string;
}[] = [
  { id: 'yellow', name: 'Yellow', hex: '#FFE66D', bgClass: 'vedora-hl-yellow' },
  { id: 'green', name: 'Mint Green', hex: '#A8E6CF', bgClass: 'vedora-hl-green' },
  { id: 'pink', name: 'Coral Pink', hex: '#FFB3B3', bgClass: 'vedora-hl-pink' },
  { id: 'blue', name: 'Sky Blue', hex: '#9ED8F5', bgClass: 'vedora-hl-blue' },
  { id: 'purple', name: 'Lavender Purple', hex: '#D8B4F8', bgClass: 'vedora-hl-purple' },
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

export type ReaderFont = 'sans' | 'serif' | 'editorial' | 'mono';

export const READER_FONTS: { id: ReaderFont; name: string; fontClass: string; description: string }[] = [
  { id: 'sans', name: 'Plus Jakarta Sans', fontClass: 'font-sans', description: 'Modern clean sans-serif' },
  { id: 'serif', name: 'Playfair Display', fontClass: 'font-serif-display', description: 'Literary display serif' },
  { id: 'editorial', name: 'Newsreader', fontClass: 'font-editorial', description: 'Book editorial serif' },
  { id: 'mono', name: 'JetBrains / System Mono', fontClass: 'font-mono', description: 'Technical monospace' },
];

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
