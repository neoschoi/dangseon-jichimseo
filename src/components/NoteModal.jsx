import React, { useState, useEffect } from 'react';
import { X, FileText, Trash2, Save } from 'lucide-react';

export default function NoteModal({
  isOpen,
  onClose,
  page,
  initialText = '',
  onSaveNote,
  onDeleteNote
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(initialText || '');
  }, [initialText, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveNote(page, text.trim());
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`p.${page} 메모를 삭제하시겠습니까?`)) {
      onDeleteNote(page);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div 
        className="w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">페이지 메모</h3>
              <p className="text-[11px] text-stone-400">제 {page} 페이지 메모 작성</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="이 페이지에 대한 메모나 생각, 전략 포인트를 자유롭게 기록하세요..."
            rows={6}
            autoFocus
            className="w-full p-3 rounded-xl bg-black/10 dark:bg-white/5 border border-stone-500/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-stone-500 resize-none leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t flex items-center justify-between bg-black/5 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
          {initialText ? (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>삭제</span>
            </button>
          ) : <div></div>}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>저장하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
