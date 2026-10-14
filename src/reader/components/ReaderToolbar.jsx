import {
  ArrowLeft,
  ListTree,
  Search,
  Bookmark,
  BookMarked,
  Pause,
  Play,
  Square,
  Expand,
  Type,
} from 'lucide-react';
import WindowControls from '../../components/WindowControls.jsx';
import { SurfacePanel, ActionButton } from '../../components/Controls.jsx';
export function ReaderToolbar({
  startWindowDrag,
  moveWindowDrag,
  endWindowDrag,
  onBack,
  book,
  chapter,
  panel,
  setPanel,
  hasBookmark,
  toggleBookmark,
  ttsStatus,
  toggleTts,
  stopTts,
}) {
  return (
    <header
      className="reader-titlebar"
      title="按住空白处拖动窗口"
      onPointerDown={startWindowDrag}
      onPointerMove={moveWindowDrag}
      onPointerUp={endWindowDrag}
      onPointerCancel={endWindowDrag}
    >
      <SurfacePanel className="reader-toolbar">
        <ActionButton className="reader-back" onClick={onBack} aria-label="返回书库">
          <ArrowLeft size={18} />
          <span>{'书库'}</span>
        </ActionButton>
        <div className="reader-title-copy">
          <strong>{book.title}</strong>
          <span>{chapter || book.author}</span>
        </div>
        <div className="reader-actions">
          <ActionButton
            className={`toc-action ${panel === 'toc' ? 'active' : ''}`}
            onClick={() => setPanel(panel === 'toc' ? null : 'toc')}
            aria-label="目录"
          >
            <ListTree size={18} />
          </ActionButton>
          <ActionButton
            className={`search-action ${panel === 'search' ? 'active' : ''}`}
            onClick={() => setPanel(panel === 'search' ? null : 'search')}
            aria-label="搜索"
          >
            <Search size={18} />
          </ActionButton>
          <ActionButton
            className={`bookmark-action ${hasBookmark ? 'active' : ''}`}
            onClick={toggleBookmark}
            aria-label="添加书签"
          >
            <Bookmark size={18} fill={hasBookmark ? 'currentColor' : 'none'} />
          </ActionButton>
          <ActionButton
            className={`notes-action ${panel === 'notes' ? 'active' : ''}`}
            onClick={() => setPanel(panel === 'notes' ? null : 'notes')}
            aria-label="批注"
          >
            <BookMarked size={18} />
          </ActionButton>
          <ActionButton
            className={`tts-action ${ttsStatus !== 'off' ? 'active' : ''}`}
            onClick={toggleTts}
            aria-label="朗读"
          >
            {ttsStatus === 'playing' ? <Pause size={18} /> : <Play size={18} />}
          </ActionButton>
          {ttsStatus !== 'off' && (
            <ActionButton className="tts-stop-action" onClick={stopTts} aria-label="停止朗读">
              <Square size={15} fill="currentColor" />
            </ActionButton>
          )}
          <ActionButton
            className="fullscreen-action"
            onClick={() => window.clearleaf.window.toggleFullscreen()}
            aria-label="全屏阅读"
          >
            <Expand size={17} />
          </ActionButton>
          <ActionButton
            className={`settings-action ${panel === 'settings' ? 'active' : ''}`}
            onClick={() => setPanel(panel === 'settings' ? null : 'settings')}
            aria-label="阅读设置"
          >
            <Type size={19} />
          </ActionButton>
        </div>
      </SurfacePanel>
      <WindowControls />
    </header>
  );
}
