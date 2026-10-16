import React from 'react';
import { Book } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface BookCoverProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({ book, size = 'md', className = '' }) => {
  const { theme } = useTheme();
  const sizeClasses = {
    sm: 'w-[52px] h-[74px] text-[6px]',
    md: 'w-[96px] h-[134px] text-[9px]',
    lg: 'w-[140px] h-[196px] text-[12px]',
  }[size];

  const renderCoverArtwork = () => {
    switch (book.coverVariant) {
      case 'psychology-of-money':
        return (
          <div className="w-full h-full bg-[#F5F2EC] text-[#1A1816] flex flex-col justify-between p-2 relative overflow-hidden select-none border-l-[3px] border-black/15 shadow-inner">
            <div className="text-center">
              <span className="text-[5px] uppercase tracking-wider text-stone-500 font-sans block opacity-70">
                Wall Street Journal Bestseller
              </span>
              <h4 className="font-serif-display font-bold leading-[1.05] text-stone-900 mt-1 tracking-tight" style={{ fontSize: size === 'sm' ? '7px' : size === 'md' ? '11px' : '16px' }}>
                The<br />Psychology<br />of Money
              </h4>
            </div>
            <div className="my-auto flex items-center justify-center relative">
              <svg
                viewBox="0 0 100 100"
                className="w-10 h-10 opacity-75 text-stone-800"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <circle cx="50" cy="50" r="38" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="32" strokeWidth="0.8" />
                <path d="M25 50 Q38 28 50 50 T75 50" strokeWidth="1" />
                <path d="M50 25 Q72 38 50 50 T50 75" strokeWidth="1" />
                <circle cx="50" cy="50" r="16" strokeDasharray="2 1" />
                <path d="M35 40 Q50 60 65 40" strokeWidth="0.9" />
              </svg>
            </div>
            <div className="text-center pb-0.5">
              <p className="font-sans font-semibold text-stone-700 uppercase tracking-widest text-[5.5px]">
                Morgan Housel
              </p>
            </div>
          </div>
        );
      case 'atomic-habits':
        return (
          <div className="w-full h-full bg-[#FAF8F3] text-stone-900 flex flex-col justify-between p-2 relative overflow-hidden select-none border-l-[3px] border-amber-900/15 shadow-inner">
            <div className="text-center pt-0.5">
              <span className="text-[4.5px] uppercase tracking-widest text-stone-500 font-medium block">
                An Easy & Proven Way
              </span>
              <span className="text-[4.5px] uppercase tracking-widest text-stone-500 font-medium block">
                To Build Good Habits
              </span>
            </div>
            <div className="my-auto relative flex flex-col items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 80 80" className="w-16 h-16 opacity-85">
                  <circle cx="40" cy="18" r="1.5" fill="#F59E0B" />
                  <circle cx="55" cy="23" r="1.8" fill="#F97316" />
                  <circle cx="62" cy="40" r="2" fill="#D97706" />
                  <circle cx="55" cy="57" r="1.8" fill="#F59E0B" />
                  <circle cx="40" cy="62" r="1.5" fill="#F97316" />
                  <circle cx="25" cy="57" r="1.8" fill="#D97706" />
                  <circle cx="18" cy="40" r="2" fill="#F59E0B" />
                  <circle cx="25" cy="23" r="1.8" fill="#F97316" />
                  <circle cx="40" cy="28" r="1.2" fill="#F59E0B" />
                  <circle cx="49" cy="33" r="1.5" fill="#EA580C" />
                  <circle cx="49" cy="47" r="1.5" fill="#D97706" />
                  <circle cx="40" cy="52" r="1.2" fill="#F59E0B" />
                  <circle cx="31" cy="47" r="1.5" fill="#EA580C" />
                  <circle cx="31" cy="33" r="1.5" fill="#D97706" />
                </svg>
              </div>
              <h4 className="font-sans font-extrabold text-stone-900 tracking-tight text-center leading-[1] relative z-10" style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '12px' : '18px' }}>
                Atomic<br />Habits
              </h4>
            </div>
            <div className="text-center pb-0.5">
              <p className="font-sans font-bold text-stone-800 text-[6px]">
                James Clear
              </p>
            </div>
          </div>
        );
      case 'design-of-everyday-things':
        return (
          <div className="w-full h-full bg-[#F5B82A] text-stone-950 flex flex-col justify-between p-2 relative overflow-hidden select-none border-l-[3px] border-yellow-800/25 shadow-inner">
            <div className="text-center pt-0.5">
              <span className="text-[5px] uppercase font-bold tracking-widest text-stone-800 block">
                The
              </span>
              <h4 className="font-sans font-black uppercase text-stone-950 tracking-tighter leading-[0.95] text-center" style={{ fontSize: size === 'sm' ? '7px' : size === 'md' ? '11px' : '16px' }}>
                DESIGN<br />
                <span className="text-[7px] font-medium tracking-normal font-serif lowercase italic">of</span><br />
                EVERYDAY<br />
                THINGS
              </h4>
            </div>
            <div className="my-auto flex items-center justify-center">
              <svg viewBox="0 0 100 80" className="w-12 h-10 drop-shadow-sm">
                <ellipse cx="50" cy="52" rx="28" ry="20" fill="#DC2626" />
                <ellipse cx="50" cy="34" rx="14" ry="4" fill="#991B1B" />
                <circle cx="50" cy="30" r="3" fill="#DC2626" />
                <path
                  d="M66 44 C 74 38, 76 28, 68 24 C 64 22, 60 26, 62 30 C 64 34, 60 38, 56 42"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M68 46 C 82 50, 80 66, 66 66"
                  fill="none"
                  stroke="#991B1B"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-center pb-0.5">
              <p className="font-sans font-extrabold uppercase tracking-wider text-stone-900 text-[6px]">
                DON NORMAN
              </p>
            </div>
          </div>
        );
      case 'laws-of-ux':
        return (
          <div className="w-full h-full bg-[#279B95] text-white flex flex-col justify-between p-2 relative overflow-hidden select-none border-l-[3px] border-teal-900/30 shadow-inner">
            <div className="text-left pt-0.5">
              <span className="text-[4px] uppercase tracking-widest text-teal-100 font-semibold block">
                Jon Yablonski
              </span>
              <h4 className="font-sans font-black uppercase text-white tracking-tight leading-[1] mt-0.5" style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '12px' : '17px' }}>
                LAWS<br />OF UX
              </h4>
            </div>
            <div className="my-auto flex items-center justify-center">
              <svg viewBox="0 0 100 80" className="w-14 h-12">
                <path d="M10 60 C30 20, 70 20, 90 60" fill="none" stroke="#A7F3D0" strokeWidth="4" />
                <path d="M18 64 C34 32, 66 32, 82 64" fill="none" stroke="#FDE68A" strokeWidth="4" />
                <path d="M26 68 C38 44, 62 44, 74 68" fill="none" stroke="#FCA5A5" strokeWidth="4" />
                <circle cx="50" cy="35" r="5" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="text-left pb-0.5">
              <p className="font-sans font-medium text-teal-100/90 text-[4.5px] leading-tight">
                Design with Psychology
              </p>
            </div>
          </div>
        );
      case 'deep-work':
        return (
          <div className="w-full h-full bg-[#18181B] text-white flex flex-col justify-between p-2 relative overflow-hidden select-none border-l-[3px] border-stone-800 shadow-inner">
            <div className="text-center pt-0.5">
              <span className="text-[4.5px] uppercase tracking-widest text-stone-400 font-sans block">
                Rules for Focused Success
              </span>
            </div>
            <div className="my-auto text-center">
              <h4 className="font-sans font-black tracking-tighter uppercase text-white leading-[0.9]" style={{ fontSize: size === 'sm' ? '9px' : size === 'md' ? '14px' : '20px' }}>
                DEEP<br />WORK
              </h4>
              <div className="w-6 h-[2px] bg-red-600 mx-auto my-1.5" />
            </div>
            <div className="text-center pb-0.5">
              <p className="font-sans font-bold uppercase tracking-wider text-stone-300 text-[6px]">
                CAL NEWPORT
              </p>
            </div>
          </div>
        );
      default: {
        const titleStr = book.fileName || book.title || 'Document';
        const coverBg = book.coverBgColor || theme.brandPrimary;
        return (
          <div
            className="w-full h-full text-white flex flex-col justify-between p-2 select-none border-l-[3px] shadow-inner relative overflow-hidden"
            style={{
              backgroundColor: coverBg,
              borderLeftColor: theme.secondary,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[5px] uppercase font-black tracking-widest px-1 py-0.2 rounded-xs"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: theme.mutedAccent,
                }}
              >
                PDF
              </span>
              <span className="text-[5px] text-white/80 font-mono">
                {book.totalPages || 1}p
              </span>
            </div>
            <div className="my-auto text-left py-1">
              <h4
                className="font-serif-display font-bold leading-[1.1] text-white line-clamp-3 tracking-tight"
                style={{ fontSize: size === 'sm' ? '7px' : size === 'md' ? '10px' : '14px' }}
              >
                {titleStr.replace(/\.pdf$/i, '')}
              </h4>
            </div>
            <div className="text-left pt-0.5 border-t border-white/20">
              <p className="font-sans font-medium text-white/70 text-[5.5px] truncate">
                {book.fileSize || 'Local Document'}
              </p>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`relative rounded-md overflow-hidden shadow-sm shrink-0 transition-transform active:scale-95 duration-200 border border-black/10 ${sizeClasses} ${className}`}
    >
      {renderCoverArtwork()}
      <div className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[2px] bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
    </div>
  );
};
