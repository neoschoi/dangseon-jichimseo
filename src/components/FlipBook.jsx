import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Bookmark, FileText, Loader2 } from 'lucide-react';

export default function FlipBook({
  totalPages,
  currentPage,
  onPageChange,
  isSinglePage,
  zoom,
  bookmarks,
  notes,
  openNoteModal,
  getPageUrl
}) {
  const containerRef = useRef(null);
  const [animating, setAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState(null); // 'next' | 'prev'
  const [animPages, setAnimPages] = useState({ front: null, back: null });

  // Loaded page image URLs (supports both static paths and dynamic PDF data URLs)
  const [leftUrl, setLeftUrl] = useState(null);
  const [rightUrl, setRightUrl] = useState(null);
  const [animFrontUrl, setAnimFrontUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pan state for zoom mode
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const didMoveRef = useRef(false);

  // Calculate left and right page numbers in spread mode
  const leftPageNum = isSinglePage ? currentPage : (currentPage % 2 === 1 ? currentPage : currentPage - 1);
  const rightPageNum = isSinglePage ? null : (leftPageNum + 1 <= totalPages ? leftPageNum + 1 : null);

  // Load visible page URLs
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const promises = [
      Promise.resolve(getPageUrl(leftPageNum)),
      rightPageNum ? Promise.resolve(getPageUrl(rightPageNum)) : Promise.resolve(null)
    ];

    Promise.all(promises).then(([l, r]) => {
      if (active) {
        setLeftUrl(l);
        setRightUrl(r);
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load page URL:', err);
      if (active) setIsLoading(false);
    });

    return () => { active = false; };
  }, [leftPageNum, rightPageNum, getPageUrl]);

  // Preload adjacent pages
  useEffect(() => {
    const pagesToPreload = [
      leftPageNum - 2,
      leftPageNum - 1,
      rightPageNum ? rightPageNum + 1 : leftPageNum + 1,
      rightPageNum ? rightPageNum + 2 : leftPageNum + 2
    ].filter(p => p && p >= 1 && p <= totalPages);

    pagesToPreload.forEach(p => {
      Promise.resolve(getPageUrl(p)).catch(() => {});
    });
  }, [leftPageNum, rightPageNum, totalPages, getPageUrl]);

  // Turn to Next Page with animation
  const handleNext = useCallback(() => {
    if (animating) return;
    const step = isSinglePage ? 1 : 2;
    const nextPage = Math.min(totalPages, (isSinglePage ? currentPage : leftPageNum) + step);
    if (nextPage === currentPage && nextPage === (rightPageNum || leftPageNum)) return;

    if (!isSinglePage && rightPageNum) {
      setAnimDirection('next');
      setAnimPages({ front: rightPageNum, back: nextPage });
      setAnimFrontUrl(rightUrl);
      setAnimating(true);
      setTimeout(() => {
        onPageChange(nextPage);
        setAnimating(false);
        setAnimDirection(null);
      }, 420);
    } else {
      onPageChange(nextPage);
    }
  }, [animating, isSinglePage, totalPages, currentPage, leftPageNum, rightPageNum, rightUrl, onPageChange]);

  // Turn to Previous Page with animation
  const handlePrev = useCallback(() => {
    if (animating) return;
    const step = isSinglePage ? 1 : 2;
    const prevPage = Math.max(1, (isSinglePage ? currentPage : leftPageNum) - step);
    if (prevPage === currentPage && prevPage === leftPageNum) return;

    if (!isSinglePage && leftPageNum > 1) {
      setAnimDirection('prev');
      setAnimPages({ front: leftPageNum, back: prevPage + 1 });
      setAnimFrontUrl(leftUrl);
      setAnimating(true);
      setTimeout(() => {
        onPageChange(prevPage);
        setAnimating(false);
        setAnimDirection(null);
      }, 420);
    } else {
      onPageChange(prevPage);
    }
  }, [animating, isSinglePage, currentPage, leftPageNum, leftUrl, onPageChange]);

  // Mouse pan handlers for zoom
  const handleMouseDown = (e) => {
    didMoveRef.current = false;
    if (zoom <= 1) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || zoom <= 1) return;
    didMoveRef.current = true;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const isLeftBookmarked = bookmarks.includes(leftPageNum);
  const isRightBookmarked = rightPageNum && bookmarks.includes(rightPageNum);
  const leftNote = notes[leftPageNum];
  const rightNote = rightPageNum && notes[rightPageNum];

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
      }}
    >
      {/* Zoom / Pan Wrapper */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Book Container with perspective */}
        <div 
          className="relative max-w-6xl max-h-[85vh] w-full h-full flex items-center justify-center p-2 sm:p-4 perspective-[2000px]"
        >
          {/* SPREAD MODE (Double Page) */}
          {!isSinglePage && (
            <div 
              className="relative flex items-center justify-center shadow-2xl rounded-md overflow-hidden bg-white/5 border border-stone-700/30"
              style={{
                boxShadow: 'var(--book-shadow)',
                maxWidth: 'min(100%, calc(82vh * 1.3716))',
                maxHeight: '82vh',
                aspectRatio: '1.3716 / 1',
                width: '100%',
                height: 'auto'
              }}
            >
              {/* LEFT PAGE */}
              <div 
                onClick={() => {
                  if (zoom === 1 && !didMoveRef.current) handlePrev();
                }}
                className="relative w-1/2 h-full bg-white flex items-center justify-center overflow-hidden cursor-pointer group"
              >
                {leftUrl ? (
                  <img
                    src={leftUrl}
                    alt={`Page ${leftPageNum}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}

                {/* Left Page Spine Shadow */}
                <div 
                  className="absolute inset-y-0 right-0 w-12 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 60%, rgba(0,0,0,0.22) 100%)'
                  }}
                />

                {/* Left Outer Page Shadow */}
                <div 
                  className="absolute inset-y-0 left-0 w-4 pointer-events-none z-10 opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%)'
                  }}
                />

                {/* Page Number Label */}
                <div className="absolute bottom-2 left-4 z-10 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[11px] backdrop-blur-[2px] opacity-75 group-hover:opacity-100 transition-opacity">
                  {leftPageNum}
                </div>

                {/* Bookmark indicator */}
                {isLeftBookmarked && (
                  <div 
                    className="absolute top-0 left-5 z-20 text-amber-500 drop-shadow-md animate-bounce"
                    title={`p.${leftPageNum} 북마크`}
                  >
                    <Bookmark className="w-6 h-6 fill-current" />
                  </div>
                )}

                {/* Note badge */}
                {leftNote && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openNoteModal(leftPageNum);
                    }}
                    className="absolute bottom-2 left-16 z-20 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-[11px] font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
                    title={`p.${leftPageNum} 메모 보기`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>메모</span>
                  </button>
                )}
              </div>

              {/* CENTER BOOK CREASE (Spine divider) */}
              <div 
                className="w-[2px] h-full z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)'
                }}
              />

              {/* RIGHT PAGE */}
              <div 
                onClick={() => {
                  if (zoom === 1 && !didMoveRef.current) handleNext();
                }}
                className="relative w-1/2 h-full bg-white flex items-center justify-center overflow-hidden cursor-pointer group"
              >
                {rightPageNum ? (
                  <>
                    {rightUrl ? (
                      <img
                        src={rightUrl}
                        alt={`Page ${rightPageNum}`}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}

                    {/* Right Page Spine Shadow */}
                    <div 
                      className="absolute inset-y-0 left-0 w-12 pointer-events-none z-10"
                      style={{
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0) 100%)'
                      }}
                    />

                    {/* Right Outer Page Shadow */}
                    <div 
                      className="absolute inset-y-0 right-0 w-4 pointer-events-none z-10 opacity-30 group-hover:opacity-60 transition-opacity"
                      style={{
                        background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%)'
                      }}
                    />

                    {/* Page Number Label */}
                    <div className="absolute bottom-2 right-4 z-10 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[11px] backdrop-blur-[2px] opacity-75 group-hover:opacity-100 transition-opacity">
                      {rightPageNum}
                    </div>

                    {/* Bookmark indicator */}
                    {isRightBookmarked && (
                      <div 
                        className="absolute top-0 right-5 z-20 text-amber-500 drop-shadow-md animate-bounce"
                        title={`p.${rightPageNum} 북마크`}
                      >
                        <Bookmark className="w-6 h-6 fill-current" />
                      </div>
                    )}

                    {/* Note badge */}
                    {rightNote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNoteModal(rightPageNum);
                        }}
                        className="absolute bottom-2 right-16 z-20 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-[11px] font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
                        title={`p.${rightPageNum} 메모 보기`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>메모</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
                    (마지막 페이지)
                  </div>
                )}
              </div>

              {/* 3D FLIPPING LEAF OVERLAY */}
              {animating && animDirection === 'next' && animFrontUrl && (
                <div 
                  className="absolute top-0 right-0 w-1/2 h-full z-30 origin-left pointer-events-none shadow-2xl"
                  style={{
                    animation: 'flipRightToLeft 0.42s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="absolute inset-0 bg-white backface-hidden flex items-center justify-center overflow-hidden">
                    <img 
                      src={animFrontUrl} 
                      alt="Turning" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent" />
                  </div>
                </div>
              )}

              {animating && animDirection === 'prev' && animFrontUrl && (
                <div 
                  className="absolute top-0 left-0 w-1/2 h-full z-30 origin-right pointer-events-none shadow-2xl"
                  style={{
                    animation: 'flipLeftToRight 0.42s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="absolute inset-0 bg-white backface-hidden flex items-center justify-center overflow-hidden">
                    <img 
                      src={animFrontUrl} 
                      alt="Turning" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SINGLE PAGE MODE */}
          {isSinglePage && (
            <div 
              className="relative shadow-2xl rounded-md overflow-hidden bg-white border border-stone-700/30 group"
              style={{
                boxShadow: 'var(--book-shadow)',
                maxWidth: 'min(100%, calc(82vh * 0.6858))',
                maxHeight: '82vh',
                aspectRatio: '0.6858 / 1',
                width: '100%',
                height: 'auto'
              }}
            >
              {leftUrl ? (
                <img
                  src={leftUrl}
                  alt={`Page ${currentPage}`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {/* Page Number Label */}
              <div className="absolute bottom-2 right-4 z-10 px-2.5 py-0.5 rounded bg-black/60 text-white font-mono text-[11px] backdrop-blur-[2px] opacity-75 group-hover:opacity-100 transition-opacity">
                p.{currentPage} / {totalPages}
              </div>

              {/* Bookmark indicator */}
              {bookmarks.includes(currentPage) && (
                <div 
                  className="absolute top-0 right-5 z-20 text-amber-500 drop-shadow-md animate-bounce"
                  title={`p.${currentPage} 북마크`}
                >
                  <Bookmark className="w-6 h-6 fill-current" />
                </div>
              )}

              {/* Note badge */}
              {notes[currentPage] && (
                <button
                  onClick={() => openNoteModal(currentPage)}
                  className="absolute bottom-2 left-4 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-[11px] font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
                  title={`p.${currentPage} 메모 보기`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>메모 작성됨</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Prev Button (Left) */}
      <button
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white shadow-xl backdrop-blur-md transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none hover:scale-110 active:scale-95 z-30 cursor-pointer border border-white/15"
        title="이전 페이지 (←)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Floating Next Button (Right) */}
      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white shadow-xl backdrop-blur-md transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none hover:scale-110 active:scale-95 z-30 cursor-pointer border border-white/15"
        title="다음 페이지 (→, Space)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Reading Progress Bar at the very bottom */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20 dark:bg-white/10 z-10">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
}
