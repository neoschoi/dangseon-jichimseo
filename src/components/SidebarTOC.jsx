import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  BookMarked, 
  Bookmark, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Sparkles
} from 'lucide-react';
import bookMeta from '../data/bookMeta.json';

export default function SidebarTOC({
  isOpen,
  onClose,
  currentPage,
  onSelectPage,
  bookmarks,
  onRemoveBookmark,
  notes,
  onOpenNote,
  currentBook,
  pdfOutline = []
}) {
  const [activeTab, setActiveTab] = useState('toc'); // 'toc' | 'bookmarks' | 'notes'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({
    ch1: true,
    ch2: true,
    ch3: true,
    ch4: true,
    ch5: true,
    ch6: true
  });

  const toggleChapter = (chId) => {
    setExpandedChapters(prev => ({ ...prev, [chId]: !prev[chId] }));
  };

  // Build chapter list depending on whether it's the scanned book or a custom PDF
  const chaptersList = useMemo(() => {
    if (currentBook.type === 'scan') {
      return bookMeta.chapters;
    }

    // For PDF
    if (pdfOutline && pdfOutline.length > 0) {
      return pdfOutline.map((item, idx) => ({
        id: `pdf_toc_${idx}`,
        title: item.title,
        page: item.page,
        sections: []
      }));
    }

    // Fallback: Generate 10-page intervals for large PDFs or single pages for small PDFs
    const list = [];
    const step = currentBook.totalPages > 30 ? 10 : 1;
    for (let p = 1; p <= currentBook.totalPages; p += step) {
      const endP = Math.min(p + step - 1, currentBook.totalPages);
      list.push({
        id: `page_${p}`,
        title: step > 1 ? `제 ${p} ~ ${endP} 페이지` : `제 ${p} 페이지`,
        page: p,
        sections: []
      });
    }
    return list;
  }, [currentBook, pdfOutline]);

  // Find active chapter based on current page
  const currentChapterId = useMemo(() => {
    if (!chaptersList || chaptersList.length === 0) return null;
    let current = chaptersList[0]?.id;
    for (const ch of chaptersList) {
      if (currentPage >= ch.page) {
        current = ch.id;
      }
    }
    return current;
  }, [currentPage, chaptersList]);

  // Filter TOC based on search
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chaptersList;
    const q = searchQuery.toLowerCase();
    return chaptersList.map(ch => {
      const matchTitle = ch.title.toLowerCase().includes(q) || (ch.subtitle && ch.subtitle.toLowerCase().includes(q));
      const matchedSections = ch.sections ? ch.sections.filter(s => s.title.toLowerCase().includes(q)) : [];
      if (matchTitle || matchedSections.length > 0) {
        return {
          ...ch,
          sections: matchTitle ? ch.sections : matchedSections
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery, chaptersList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 sm:w-96 z-40 flex flex-col shadow-2xl transition-all duration-300 border-r select-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Top Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-base tracking-tight truncate max-w-[220px]">
            {currentBook.type === 'pdf' ? currentBook.title : '도서 탐색기'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-stone-400 hover:text-stone-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs font-semibold" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('toc')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'toc' 
              ? 'border-blue-500 text-blue-400 font-bold' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <span>목차</span>
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'bookmarks' 
              ? 'border-amber-500 text-amber-400 font-bold' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>북마크</span>
          {bookmarks.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded-full">
              {bookmarks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'notes' 
              ? 'border-emerald-500 text-emerald-400 font-bold' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>내 메모</span>
          {Object.keys(notes).length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full">
              {Object.keys(notes).length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar for TOC */}
      {activeTab === 'toc' && (
        <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="장 제목 또는 소주제 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/10 dark:bg-white/5 border border-stone-500/20 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-stone-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-200 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Tab 1: TOC */}
        {activeTab === 'toc' && (
          <div>
            {filteredChapters.map((ch) => {
              const isActive = currentChapterId === ch.id;
              const hasSections = ch.sections && ch.sections.length > 0;
              const isExpanded = expandedChapters[ch.id];

              return (
                <div key={ch.id} className="mb-2 rounded-lg overflow-hidden border border-stone-500/10">
                  <div
                    onClick={() => {
                      onSelectPage(ch.page);
                      if (hasSections) toggleChapter(ch.id);
                    }}
                    className={`p-2.5 flex items-start justify-between gap-2 cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-blue-500/15 text-blue-400 font-semibold' 
                        : 'hover:bg-black/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{ch.title}</span>
                      </div>
                      {ch.subtitle && (
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">{ch.subtitle}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-mono text-stone-400 bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded">
                        p.{ch.page}
                      </span>
                      {hasSections && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapter(ch.id);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-200"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nested Sections */}
                  {hasSections && isExpanded && (
                    <div className="bg-black/15 dark:bg-black/20 divide-y divide-stone-500/10">
                      {ch.sections.map((sec, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSelectPage(sec.page)}
                          className="px-3 py-2 pl-6 hover:bg-blue-500/10 transition-colors cursor-pointer flex items-center justify-between text-[11px] text-stone-300 hover:text-white"
                        >
                          <span className="truncate pr-2">{sec.title}</span>
                          <span className="font-mono text-stone-500 shrink-0 text-[10px]">p.{sec.page}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-2 p-1">
            {bookmarks.length === 0 ? (
              <div className="text-center py-12 text-stone-400 space-y-2">
                <Bookmark className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">저장된 북마크가 없습니다.</p>
                <p className="text-[11px] text-stone-500">상단 북마크 아이콘(B)을 눌러 추가하세요.</p>
              </div>
            ) : (
              bookmarks.map((bmPage) => (
                <div
                  key={bmPage}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors border border-stone-500/15"
                >
                  <button
                    onClick={() => onSelectPage(bmPage)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                    <div>
                      <span className="text-xs font-semibold">제 {bmPage} 페이지</span>
                      <p className="text-[10px] text-stone-400">클릭하여 즉시 이동</p>
                    </div>
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bmPage)}
                    className="p-1.5 text-stone-400 hover:text-red-400 transition-colors rounded hover:bg-red-500/10 cursor-pointer"
                    title="북마크 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-2 p-1">
            {Object.keys(notes).length === 0 ? (
              <div className="text-center py-12 text-stone-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">작성된 메모가 없습니다.</p>
                <p className="text-[11px] text-stone-500">상단 메모 아이콘을 눌러 노트를 작성하세요.</p>
              </div>
            ) : (
              Object.entries(notes).map(([pageStr, noteText]) => {
                const p = parseInt(pageStr, 10);
                return (
                  <div
                    key={p}
                    onClick={() => onSelectPage(p)}
                    className="p-3 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors border border-stone-500/15 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <FileText className="w-3.5 h-3.5" />
                        <span>p.{p} 메모</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNote(p);
                        }}
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        수정
                      </button>
                    </div>
                    <p className="text-xs text-stone-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {noteText}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t text-[11px] text-stone-500 text-center flex items-center justify-center gap-1"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>총 {currentBook.totalPages}페이지 수록</span>
      </div>
    </div>
  );
}
