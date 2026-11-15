import React, { useState, useEffect, useCallback, useMemo } from 'react';
import HeaderNav from './components/HeaderNav.jsx';
import FlipBook from './components/FlipBook.jsx';
import SidebarTOC from './components/SidebarTOC.jsx';
import ThumbnailBar from './components/ThumbnailBar.jsx';
import NoteModal from './components/NoteModal.jsx';
import HelpModal from './components/HelpModal.jsx';
import { loadPdfDocument, renderPdfPage, renderPdfThumb, extractPdfOutline } from './utils/pdfLoader.js';

const DANGSEON_BOOK = {
  type: 'scan',
  id: 'dangseon',
  title: '한 권으로 끝내는 당선 지침서',
  subtitle: '이기는 선거비법, 승리를 기획하라',
  totalPages: 346,
  pdfDoc: null
};

export default function App() {
  // Current Book state (supports default scanned book or any opened PDF)
  const [currentBook, setCurrentBook] = useState(DANGSEON_BOOK);
  const [pdfOutline, setPdfOutline] = useState([]);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dangseon_theme') || 'dark';
  });

  // Current page state
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('dangseon_last_page');
    const val = parseInt(saved, 10);
    return !isNaN(val) && val >= 1 && val <= DANGSEON_BOOK.totalPages ? val : 1;
  });

  // UI Drawer & Modal States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [isSinglePage, setIsSinglePage] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteModalPage, setNoteModalPage] = useState(1);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1.0);

  // Bookmarks state (scoped by current book id)
  const [bookmarks, setBookmarks] = useState([]);
  // Notes state (scoped by current book id)
  const [notes, setNotes] = useState({});

  // Sync bookmarks and notes when book changes
  useEffect(() => {
    try {
      const savedBm = localStorage.getItem(`reader_bookmarks_${currentBook.id}`);
      setBookmarks(savedBm ? JSON.parse(savedBm) : []);
    } catch {
      setBookmarks([]);
    }

    try {
      const savedNotes = localStorage.getItem(`reader_notes_${currentBook.id}`);
      setNotes(savedNotes ? JSON.parse(savedNotes) : {});
    } catch {
      setNotes({});
    }
  }, [currentBook.id]);

  // Save current page to localStorage
  useEffect(() => {
    if (currentBook.id === 'dangseon') {
      localStorage.setItem('dangseon_last_page', String(currentPage));
    }
  }, [currentPage, currentBook.id]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('dangseon_theme', theme);
  }, [theme]);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem(`reader_bookmarks_${currentBook.id}`, JSON.stringify(bookmarks));
  }, [bookmarks, currentBook.id]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(`reader_notes_${currentBook.id}`, JSON.stringify(notes));
  }, [notes, currentBook.id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(2.5, +(prev + 0.25).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(1.0, +(prev - 0.25).toFixed(2)));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Bookmark handlers
  const toggleBookmark = useCallback((pageToToggle) => {
    const p = typeof pageToToggle === 'number' ? pageToToggle : currentPage;
    setBookmarks(prev => {
      if (prev.includes(p)) {
        return prev.filter(x => x !== p);
      } else {
        return [...prev, p].sort((a, b) => a - b);
      }
    });
  }, [currentPage]);

  const removeBookmark = useCallback((pageToRemove) => {
    setBookmarks(prev => prev.filter(x => x !== pageToRemove));
  }, []);

  // Note handlers
  const handleSaveNote = useCallback((page, noteText) => {
    setNotes(prev => {
      const next = { ...prev };
      if (!noteText) {
        delete next[page];
      } else {
        next[page] = noteText;
      }
      return next;
    });
  }, []);

  const handleDeleteNote = useCallback((page) => {
    setNotes(prev => {
      const next = { ...prev };
      delete next[page];
      return next;
    });
  }, []);

  const openNoteForPage = useCallback((page) => {
    setNoteModalPage(page);
    setIsNoteModalOpen(true);
  }, []);

  // PDF Loading Handlers
  const handleOpenPdfFile = useCallback(async (file) => {
    try {
      const { pdfDoc, numPages, title } = await loadPdfDocument(file);
      const outline = await extractPdfOutline(pdfDoc);

      setCurrentBook({
        type: 'pdf',
        id: `pdf_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        title: title || file.name,
        subtitle: `${file.name} (총 ${numPages}페이지)`,
        totalPages: numPages,
        pdfDoc
      });
      setPdfOutline(outline);
      setCurrentPage(1);
    } catch (err) {
      console.error('PDF 열기 실패:', err);
      alert('PDF 파일을 열지 못했습니다: ' + err.message);
    }
  }, []);

  const handleLoadSamplePdf = useCallback(async () => {
    try {
      const sampleUrl = `${import.meta.env.BASE_URL}sample_election_guide.pdf`;
      const { pdfDoc, numPages, title } = await loadPdfDocument(sampleUrl);
      const outline = await extractPdfOutline(pdfDoc);

      setCurrentBook({
        type: 'pdf',
        id: 'sample_pdf_guide',
        title: title || '2026 선거 전략 매뉴얼 (샘플)',
        subtitle: 'PDF 파일 열기 기능 검증용 샘플 도서 (5p)',
        totalPages: numPages,
        pdfDoc
      });
      setPdfOutline(outline);
      setCurrentPage(1);
    } catch (err) {
      console.error('샘플 PDF 로드 실패:', err);
      alert('샘플 PDF를 불러오지 못했습니다: ' + err.message);
    }
  }, []);

  const handleSwitchToDangseon = useCallback(() => {
    setCurrentBook(DANGSEON_BOOK);
    setPdfOutline([]);
    const saved = localStorage.getItem('dangseon_last_page');
    const val = parseInt(saved, 10);
    setCurrentPage(!isNaN(val) && val >= 1 && val <= DANGSEON_BOOK.totalPages ? val : 1);
  }, []);

  // Universal page image getters
  const getPageUrl = useCallback((pageNum) => {
    if (pageNum < 1 || pageNum > currentBook.totalPages) return Promise.resolve(null);
    if (currentBook.type === 'scan') {
      const pad = String(pageNum).padStart(4, '0');
      return Promise.resolve(`${import.meta.env.BASE_URL}book_pages/high/${pad}.webp`);
    } else if (currentBook.type === 'pdf' && currentBook.pdfDoc) {
      return renderPdfPage(currentBook.pdfDoc, pageNum, 2.0);
    }
    return Promise.resolve(null);
  }, [currentBook]);

  const getThumbUrl = useCallback((pageNum) => {
    if (pageNum < 1 || pageNum > currentBook.totalPages) return Promise.resolve(null);
    if (currentBook.type === 'scan') {
      const pad = String(pageNum).padStart(4, '0');
      return Promise.resolve(`${import.meta.env.BASE_URL}book_pages/thumb/${pad}.webp`);
    } else if (currentBook.type === 'pdf' && currentBook.pdfDoc) {
      return renderPdfThumb(currentBook.pdfDoc, pageNum);
    }
    return Promise.resolve(null);
  }, [currentBook]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage(p => Math.min(currentBook.totalPages, p + (isSinglePage ? 1 : 2)));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage(p => Math.max(1, p - (isSinglePage ? 1 : 2)));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(currentBook.totalPages);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBookmark(currentPage);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsThumbnailsOpen(prev => !prev);
      } else if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        setIsHelpModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsThumbnailsOpen(false);
        setIsNoteModalOpen(false);
        setIsHelpModalOpen(false);
        if (zoom > 1) handleZoomReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, currentBook.totalPages, isSinglePage, toggleFullscreen, handleZoomIn, handleZoomOut, handleZoomReset, toggleBookmark, zoom]);

  const isCurrentPageBookmarked = bookmarks.includes(currentPage);
  const hasCurrentPageNote = Boolean(notes[currentPage]);

  return (
    <div 
      className={`theme-${theme} w-screen h-screen flex flex-col overflow-hidden relative`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Top Header Navigation */}
      <HeaderNav
        currentBook={currentBook}
        onOpenPdfFile={handleOpenPdfFile}
        onLoadSamplePdf={handleLoadSamplePdf}
        onSwitchToDangseon={handleSwitchToDangseon}
        currentPage={currentPage}
        totalPages={currentBook.totalPages}
        onPageChange={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isThumbnailsOpen={isThumbnailsOpen}
        toggleThumbnails={() => setIsThumbnailsOpen(prev => !prev)}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        theme={theme}
        setTheme={setTheme}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isSinglePage={isSinglePage}
        toggleSinglePage={() => setIsSinglePage(prev => !prev)}
        isCurrentPageBookmarked={isCurrentPageBookmarked}
        toggleBookmark={() => toggleBookmark(currentPage)}
        hasCurrentPageNote={hasCurrentPageNote}
        openNoteModal={() => openNoteForPage(currentPage)}
        openHelpModal={() => setIsHelpModalOpen(true)}
      />

      {/* Main Reading Canvas */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* FlipBook Core Viewer */}
        <FlipBook
          totalPages={currentBook.totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isSinglePage={isSinglePage}
          zoom={zoom}
          bookmarks={bookmarks}
          notes={notes}
          openNoteModal={openNoteForPage}
          getPageUrl={getPageUrl}
        />

        {/* Sidebar TOC & Bookmarks Drawer */}
        <SidebarTOC
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentPage={currentPage}
          onSelectPage={(page) => {
            setCurrentPage(page);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          bookmarks={bookmarks}
          onRemoveBookmark={removeBookmark}
          notes={notes}
          onOpenNote={openNoteForPage}
          currentBook={currentBook}
          pdfOutline={pdfOutline}
        />

        {/* Backdrop for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 sm:hidden backdrop-blur-xs"
          />
        )}
      </main>

      {/* Bottom Thumbnail Filmstrip */}
      <ThumbnailBar
        isOpen={isThumbnailsOpen}
        currentPage={currentPage}
        totalPages={currentBook.totalPages}
        onSelectPage={setCurrentPage}
        bookmarks={bookmarks}
        notes={notes}
        getThumbUrl={getThumbUrl}
      />

      {/* Modals */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        page={noteModalPage}
        initialText={notes[noteModalPage] || ''}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
