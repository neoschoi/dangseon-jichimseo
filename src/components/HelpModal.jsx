import React from 'react';
import { X, Keyboard, MousePointer, BookOpen, Sparkles } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '← / →', desc: '이전 / 다음 페이지 넘기기' },
    { key: 'Space', desc: '다음 페이지 넘기기' },
    { key: 'Home / End', desc: '첫 페이지 / 마지막 페이지로 바로 이동' },
    { key: 'F', desc: '전체화면 켜기 / 끄기' },
    { key: '+ / -', desc: '페이지 확대 / 축소 (줌)' },
    { key: '0', desc: '확대 배율 원래대로 (100%)' },
    { key: 'B', desc: '현재 페이지 북마크 등록 / 해제' },
    { key: 'M', desc: '목차 서랍 열기 / 닫기' },
    { key: 'T', desc: '하단 썸네일 바 열기 / 닫기' },
    { key: 'Esc', desc: '열린 서랍 / 모달 닫기' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div 
        className="w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">독서 도움말 및 단축키 안내</h3>
              <p className="text-[11px] text-stone-400">키보드와 마우스로 더 편리하게 읽는 방법</p>
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
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Mouse interaction tip */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-400">
              <MousePointer className="w-4 h-4" />
              <span>마우스 및 터치 넘김 안내</span>
            </div>
            <p className="text-stone-300 leading-relaxed text-[11px]">
              • 실제 책처럼 책 모서리를 마우스로 <strong>드래그하거나 클릭</strong>하면 3D 플립 애니메이션과 함께 페이지가 넘어갑니다.<br />
              • 좌우 가장자리에 마우스를 올리면 나타나는 <strong>화살표 버튼</strong>을 눌러도 넘어갑니다.<br />
              • 확대(Zoom) 상태에서는 마우스 드래그로 선명하게 세부 영역을 이동(Pan)할 수 있습니다.
            </p>
          </div>

          {/* Shortcuts Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-stone-400" />
              <span>키보드 단축키</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/10 dark:bg-white/5 border border-stone-500/15">
                  <kbd className="px-2 py-0.5 rounded bg-black/30 dark:bg-white/10 font-mono font-bold text-[11px] text-blue-400 border border-stone-500/20">
                    {s.key}
                  </kbd>
                  <span className="text-[11px] text-stone-300">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end bg-black/5 dark:bg-black/20" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
