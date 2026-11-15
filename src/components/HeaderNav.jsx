import React, { useState, useRef } from 'react';
import { 
  Menu, 
  Bookmark, 
  BookOpen, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Sun, 
  Moon, 
  Coffee, 
  HelpCircle,
  Columns2,
  Square,
  FolderOpen,
  FileUp,
  FileCheck,
  Download
} from 'lucide-react';

export default function HeaderNav({
  currentBook,
  onOpenPdfFile,
  onLoadSamplePdf,
  onSwitchToDangseon,
  onDownloadPdf,
  currentPage,
  totalPages,
  onPageChange,
  isSidebarOpen,
  toggleSidebar,
  isThumbnailsOpen,
  toggleThumbnails,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  theme,
  setTheme,
  isFullscreen,
  toggleFullscreen,
  isSinglePage,
  toggleSinglePage,
  isCurrentPageBookmarked,
  toggleBookmark,
  hasCurrentPageNote,
  openNoteModal,
  openHelpModal
}) {
  const [inputVal, setInputVal] = useState(String(currentPage));
  const fileInputRef = useRef(null);

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(inputVal, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onPageChange(val);
    } else {
      setInputVal(String(currentPage));
    }
  };

  React.useEffect(() => {
    setInputVal(String(currentPage));
  }, [currentPage]);

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('sepia');
    else if (theme === 'sepia') setTheme('light');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-blue-400" />;
    if (theme === 'sepia') return <Coffee className="w-4 h-4 text-amber-500" />;
    return <Sun className="w-4 h-4 text-yellow-500" />;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onOpenPdfFile(file);
    }
    // reset input so the same file can be reopened
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="h-14 px-3 sm:px-4 flex items-center justify-between border-b select-none z-30 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Hidden File Input for PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: Menu & Book info & File Open */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="목차 및 서재 서랍 열기 (M)"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-semibold">목차</span>
        </button>

        <div className="h-5 w-px bg-stone-500/20 hidden sm:block"></div>

        {/* File Open & Download Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm"
            title="다른 PDF 파일 열기"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF 열기</span>
          </button>

          <button
            onClick={onDownloadPdf}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm"
            title="전체 도서 PDF로 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF 다운로드</span>
          </button>

          {/* If currently viewing PDF, offer quick return to Dangseon */}
          {currentBook.type === 'pdf' ? (
            <button
              onClick={onSwitchToDangseon}
              className="px-2 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-medium transition-colors cursor-pointer text-blue-400 flex items-center gap-1"
              title="기본 당선지침서로 돌아가기"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">당선지침서</span>
            </button>
          ) : (
            <button
              onClick={onLoadSamplePdf}
              className="px-2 py-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              title="검증용 샘플 PDF (5페이지) 테스트 열기"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">샘플 PDF</span>
            </button>
          )}
        </div>

        <div className="h-5 w-px bg-stone-500/20 hidden md:block"></div>

        {/* Title display */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">
              {currentBook.title}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium hidden md:inline ${
              currentBook.type === 'pdf' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {currentBook.type === 'pdf' ? 'PDF' : 'E-BOOK'}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 hidden lg:block leading-tight truncate max-w-xs">
            {currentBook.subtitle}
          </span>
        </div>
      </div>

      {/* Center: Page Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <form onSubmit={handlePageSubmit} className="flex items-center gap-1.5 bg-black/10 dark:bg-white/5 px-2.5 py-1 rounded-full border border-stone-500/20 text-xs">
          <span className="text-stone-400 font-mono text-[11px]">p.</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handlePageSubmit}
            className="w-10 text-center font-bold font-mono bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
          />
          <span className="text-stone-400 font-mono text-[11px]">/ {totalPages}</span>
        </form>

        {/* Bookmark Quick Toggle */}
        <button
          onClick={toggleBookmark}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isCurrentPageBookmarked 
              ? 'text-amber-500 bg-amber-500/15' 
              : 'hover:bg-black/10 dark:hover:bg-white/10 text-stone-400 hover:text-stone-200'
          }`}
          title={isCurrentPageBookmarked ? "북마크 해제 (B)" : "현재 페이지 북마크 (B)"}
        >
          <Bookmark className={`w-4 h-4 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Note Quick Toggle */}
        <button
          onClick={openNoteModal}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            hasCurrentPageNote 
              ? 'text-blue-400 bg-blue-500/15' 
              : 'hover:bg-black/10 dark:hover:bg-white/10 text-stone-400 hover:text-stone-200'
          }`}
          title="현재 페이지 메모 작성/보기"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>

      {/* Right: View & Tool Controls */}
      <div className="flex items-center gap-1">
        {/* Zoom controls */}
        <div className="hidden sm:flex items-center gap-1 bg-black/10 dark:bg-white/5 rounded-lg p-0.5 border border-stone-500/20">
          <button
            onClick={onZoomOut}
            disabled={zoom <= 1}
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            title="축소 (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-medium px-1 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 2.5}
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            title="확대 (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom > 1 && (
            <button
              onClick={onZoomReset}
              className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-blue-400 cursor-pointer"
              title="원래 크기 (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Single / Double Page Toggle */}
        <button
          onClick={toggleSinglePage}
          className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer hidden md:flex items-center gap-1"
          title={isSinglePage ? "양면 보기로 전환" : "단면 보기로 전환"}
        >
          {isSinglePage ? <Columns2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          <span className="text-xs">{isSinglePage ? "단면" : "양면"}</span>
        </button>

        {/* Thumbnail Filmstrip Toggle */}
        <button
          onClick={toggleThumbnails}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isThumbnailsOpen 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'hover:bg-black/10 dark:hover:bg-white/10'
          }`}
          title="하단 썸네일 미리보기 열기/닫기 (T)"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Theme Cycle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={`테마 전환 (현재: ${theme})`}
        >
          {getThemeIcon()}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={isFullscreen ? "전체화면 종료 (F)" : "전체화면으로 읽기 (F)"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Help */}
        <button
          onClick={openHelpModal}
          className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-stone-400 hover:text-stone-200"
          title="단축키 및 사용 도움말 (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
