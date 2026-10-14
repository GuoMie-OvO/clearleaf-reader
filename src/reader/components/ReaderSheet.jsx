import React from 'react';
import { ListTree, Search, Bookmark, X, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNoteDate } from '../../lib/dates.js';
import { ReaderSettings } from '../ReaderSettings.jsx';
export function ReaderSheet({
  panel,
  setPanel,
  startWindowDrag,
  moveWindowDrag,
  endWindowDrag,
  book,
  panelTitle,
  toc,
  jumpTo,
  searchBook,
  searchQuery,
  setSearchQuery,
  searching,
  searchProgress,
  searchResults,
  viewRef,
  onUpdateBook,
  activeAnnotation,
  setActiveAnnotation,
  updateNote,
  deleteHighlight,
  settings,
  fixedLayout,
  onUpdateSettings,
}) {
  return (
    <AnimatePresence>
      {panel && (
        <React.Fragment>
          <motion.button
            className="reader-scrim"
            aria-label="关闭面板"
            onClick={() => setPanel(null)}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          />
          <motion.aside
            className="reader-sheet surface-panel"
            initial={{
              x: 24,
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: 24,
              opacity: 0,
            }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: 0.36,
            }}
          >
            <header
              className="reader-sheet-drag-handle"
              title="按住此处拖动窗口"
              onPointerDown={startWindowDrag}
              onPointerMove={moveWindowDrag}
              onPointerUp={endWindowDrag}
              onPointerCancel={endWindowDrag}
            >
              <div>
                <span className="eyebrow">{book.title}</span>
                <h2>{panelTitle}</h2>
              </div>
              <button className="no-drag" onClick={() => setPanel(null)} aria-label="关闭面板">
                <X size={18} />
              </button>
            </header>
            <div className="sheet-body no-drag" onWheel={(D) => D.stopPropagation()}>
              {panel === 'toc' && (
                <div className="toc-list">
                  {toc.length ? (
                    toc.map((D, P) => (
                      <button
                        style={{
                          paddingLeft: `${16 + D.depth * 18}px`,
                        }}
                        onClick={() => {
                          jumpTo(D.href);
                          setPanel(null);
                        }}
                        key={`${D.href}-${P}`}
                      >
                        <span>{D.label}</span>
                        <ChevronRight size={15} />
                      </button>
                    ))
                  ) : (
                    <div className="panel-empty">
                      <ListTree size={25} />
                      <p>{'这本书没有提供目录。'}</p>
                    </div>
                  )}
                </div>
              )}
              {panel === 'search' && (
                <div className="search-panel">
                  <form onSubmit={searchBook}>
                    <Search size={17} />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(D) => setSearchQuery(D.target.value)}
                      placeholder="在整本书中搜索"
                    />
                    <button type="submit">{'搜索'}</button>
                  </form>
                  {searching && (
                    <div className="searching-line">
                      <i
                        style={{
                          width: `${searchProgress * 100}%`,
                        }}
                      />
                      <span>{'正在搜索…'}</span>
                    </div>
                  )}
                  <div className="search-results">
                    {searchResults.map((D, P) => (
                      <button
                        onClick={() => {
                          viewRef.current?.goTo(D.cfi);
                          setPanel(null);
                        }}
                        key={`${D.cfi}-${P}`}
                      >
                        <span>{D.label}</span>
                        <p>
                          {D.excerpt.pre}
                          <mark>{D.excerpt.match}</mark>
                          {D.excerpt.post}
                        </p>
                      </button>
                    ))}
                    {!searching && searchQuery && !searchResults.length && searchProgress === 1 && (
                      <div className="panel-empty">
                        <Search size={25} />
                        <p>
                          {'没有找到“'}
                          {searchQuery}
                          {'”。'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {panel === 'notes' && (
                <div className="notes-panel">
                  <section>
                    <h3>
                      {'书签 '}
                      <span>{book.bookmarks.length}</span>
                    </h3>
                    {book.bookmarks.map((D) => (
                      <div className="note-card bookmark-card" key={D.id}>
                        <button
                          onClick={() => {
                            viewRef.current?.goTo(D.cfi);
                            setPanel(null);
                          }}
                        >
                          <Bookmark size={16} fill="currentColor" />
                          <div>
                            <strong>{D.label}</strong>
                            <span>
                              {Math.round(D.progress * 100)}
                              {'% · '}
                              {formatNoteDate(D.createdAt)}
                            </span>
                          </div>
                        </button>
                        <button
                          className="delete-note"
                          onClick={() =>
                            onUpdateBook({
                              bookmarks: book.bookmarks.filter((P) => P.id !== D.id),
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    {!book.bookmarks.length && (
                      <p className="empty-copy">{'点击顶部书签按钮，记住现在这一页。'}</p>
                    )}
                  </section>
                  <section>
                    <h3>
                      {'批注 '}
                      <span>{book.annotations.length}</span>
                    </h3>
                    {book.annotations.map((D) => (
                      <div
                        className={`note-card annotation-card ${activeAnnotation === D.cfi ? 'active' : ''}`}
                        key={D.id}
                      >
                        <button
                          className="annotation-jump"
                          onClick={() => {
                            setActiveAnnotation(D.cfi);
                            viewRef.current?.showAnnotation({
                              value: D.cfi,
                            });
                          }}
                        >
                          <i
                            style={{
                              background: D.color,
                            }}
                          />
                          <p>
                            {'“'}
                            {D.text}
                            {'”'}
                          </p>
                          <span>{formatNoteDate(D.createdAt)}</span>
                        </button>
                        <textarea
                          value={D.note}
                          onChange={(P) => updateNote(D, P.target.value)}
                          placeholder="添加笔记…"
                        />
                        <button className="delete-note" onClick={() => void deleteHighlight(D)}>
                          <Trash2 size={15} />
                          {' 删除'}
                        </button>
                      </div>
                    ))}
                    {!book.annotations.length && (
                      <p className="empty-copy">{'选中文字后可高亮并添加笔记。'}</p>
                    )}
                  </section>
                </div>
              )}
              {panel === 'settings' && (
                <ReaderSettings
                  settings={settings}
                  fixedLayout={fixedLayout}
                  onChange={onUpdateSettings}
                />
              )}
            </div>
          </motion.aside>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
