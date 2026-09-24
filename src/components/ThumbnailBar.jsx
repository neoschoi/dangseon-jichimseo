import React, { useRef, useEffect, useState } from 'react';
import { Bookmark, FileText } from 'lucide-react';

function ThumbItem({
  pageNum,
  getThumbUrl,
  isCurrentExact,
  isBookmarked,
  hasNote,
  onSelectPage,
  activeThumbRef
}) {
  const [thumbSrc, setThumbSrc] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.resolve(getThumbUrl(pageNum)).then(src => {
      if (active) setThumbSrc(src);
    }).catch(() => {});
    return () => { active = false; };
  }, [pageNum, getThumbUrl]);

  return (
    <div
      ref={isCurrentExact ? activeThumbRef : null}
      onClick={() => onSelectPage(pageNum)}
      className={`relative flex-shrink-0 h-24 w-18 rounded overflow-hidden cursor-pointer transition-all duration-150 border-2 group ${
        isCurrentExact 
          ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' 
          : 'border-transparent hover:border-stone-400 opacity-80 hover:opacity-100'
      }`}
    >
      {thumbSrc ? (
        <img
          src={thumbSrc}
          alt={`Page ${pageNum}`}
          loading="lazy"
          className="w-full h-full object-cover bg-stone-800"
        />
      ) : (
        <div className="w-full h-full bg-stone-800 flex items-center justify-center">
          <span className="text-[10px] text-stone-500">{pageNum}</span>
        </div>
      )}

      {/* Page Number Label */}
      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] font-mono text-center py-0.5 backdrop-blur-[2px]">
        {pageNum}
      </div>

      {/* Bookmark Indicator */}
      {isBookmarked && (
        <div className="absolute top-0 right-1 text-amber-500 drop-shadow">
          <Bookmark className="w-3.5 h-3.5 fill-current" />
        </div>
      )}

      {/* Note Indicator */}
      {hasNote && (
        <div className="absolute top-1 left-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
          <FileText className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}

export default function ThumbnailBar({
  isOpen,
  currentPage,
  totalPages,
  onSelectPage,
  bookmarks,
  notes,
  getThumbUrl
}) {
  const containerRef = useRef(null);
  const activeThumbRef = useRef(null);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (isOpen && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentPage, isOpen]);

  if (!isOpen) return null;

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="fixed bottom-0 inset-x-0 h-36 z-30 flex flex-col border-t shadow-2xl backdrop-blur-md select-none transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Top scrubber slider bar */}
      <div className="h-6 px-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-[11px] font-mono text-stone-400">1</span>
        <input
          type="range"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => onSelectPage(parseInt(e.target.value, 10))}
          className="flex-1 h-1.5 bg-stone-500/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[11px] font-mono text-stone-400">{totalPages}</span>
        <span className="text-xs font-bold text-blue-400 min-w-[50px] text-right font-mono">
          p.{currentPage}
        </span>
      </div>

      {/* Horizontal thumbnail scroll container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto flex items-center gap-2 px-4 py-2 scroll-smooth"
      >
        {pagesArray.map((pageNum) => (
          <ThumbItem
            key={pageNum}
            pageNum={pageNum}
            getThumbUrl={getThumbUrl}
            isCurrentExact={pageNum === currentPage}
            isBookmarked={bookmarks.includes(pageNum)}
            hasNote={Boolean(notes[pageNum])}
            onSelectPage={onSelectPage}
            activeThumbRef={activeThumbRef}
          />
        ))}
      </div>
    </div>
  );
}
