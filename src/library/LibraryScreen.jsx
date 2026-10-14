import React from 'react';
import {
  BookOpen,
  List,
  Library,
  CircleCheck,
  FilePlus2,
  ListTree,
  Bookmark,
  Ellipsis,
  Trash2,
  SunMedium,
  Moon,
  Search,
  Grid2x2,
  X,
} from 'lucide-react';
import WindowControls from '../components/WindowControls.jsx';
const BOOK_ACCEPT = '.epub,.txt,.pdf,.mobi,.azw3,.fb2,.cbz,.cbr,.html,.htm,.md,.markdown';
function BookCard({ book, index, onOpen, onRemove }) {
  const [menu, setMenu] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!menu) return;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenu(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [menu]);
  const progress = Math.round(Math.min(1, Math.max(0, book.progress || 0)) * 100);
  return (
    <article
      className="book-card cl-book"
      style={{
        '--book-index': index,
      }}
    >
      <div className="cl-cover-area">
        <button
          className="book-cover-button cl-cover-button"
          onClick={onOpen}
          aria-label={`打开《${book.title}》`}
        >
          <img className="book-cover cl-book-cover" src={book.cover} alt="" loading="lazy" />
          <span className="cl-cover-hover">
            <BookOpen size={18} />
            <span>开始阅读</span>
          </span>
        </button>
        {progress >= 99 && <span className="cl-finished-badge">已读完</span>}
      </div>
      <div className="cl-book-details">
        <div className="cl-book-title-row">
          <button className="cl-book-title" title={book.title} onClick={onOpen}>
            {book.title}
          </button>
          <div className="cl-menu-wrap" ref={menuRef}>
            <button
              className="card-menu-button cl-book-menu"
              aria-label={`《${book.title}》更多操作`}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Ellipsis size={18} />
            </button>
            {menu && (
              <div className="book-card-menu cl-context-menu">
                <button
                  onClick={() => {
                    setMenu(false);
                    onOpen();
                  }}
                >
                  <BookOpen size={16} />
                  阅读图书
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    setMenu(false);
                    onRemove();
                  }}
                >
                  <Trash2 size={16} />
                  从书库移除
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="cl-book-author">{book.author || '未知作者'}</p>
        <div className="cl-book-meta">
          <span className="cl-format">{book.extension.toUpperCase()}</span>
          <span>
            {book.lastOpenedAt ? (progress >= 99 ? '阅读完成' : `已读 ${progress}%`) : '尚未阅读'}
          </span>
        </div>
        {book.lastOpenedAt && progress < 99 && (
          <div className="cl-book-progress" aria-label={`阅读进度 ${progress}%`}>
            <span
              style={{
                width: `${Math.max(2, progress)}%`,
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
function LibraryScreen({
  books,
  importing,
  appTheme,
  onToggleTheme,
  onImport,
  onImportPaths,
  onOpen,
  onRemove,
}) {
  const [query, setQuery] = React.useState('');
  const [section, setSection] = React.useState('all');
  const [format, setFormat] = React.useState('all');
  const [view, setView] = React.useState(() => {
    try {
      return localStorage.getItem('clearleaf.ui.view') || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [sort, setSort] = React.useState(() => {
    try {
      return localStorage.getItem('clearleaf.ui.sort') || 'added';
    } catch {
      return 'added';
    }
  });
  const input = React.useRef(null);
  const search = React.useRef(null);
  const reading = books.filter((b) => b.lastOpenedAt && (b.progress || 0) < 0.99);
  const finished = books.filter((b) => (b.progress || 0) >= 0.99);
  const marked = books.filter((b) => b.bookmarks?.length || b.annotations?.length);
  const recent =
    [...reading].sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))[0] ||
    [...books]
      .filter((b) => b.lastOpenedAt)
      .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))[0];
  const nav = [
    {
      id: 'all',
      label: '全部图书',
      icon: Library,
      count: books.length,
    },
    {
      id: 'reading',
      label: '正在阅读',
      icon: BookOpen,
      count: reading.length,
    },
    {
      id: 'finished',
      label: '已读完',
      icon: CircleCheck,
      count: finished.length,
    },
    {
      id: 'marked',
      label: '书签与批注',
      icon: Bookmark,
      count: marked.length,
    },
  ];
  const formats = [
    {
      id: 'epub',
      label: 'EPUB 图书',
      test: (b) => b.extension === 'epub',
    },
    {
      id: 'pdf',
      label: 'PDF 文档',
      test: (b) => b.extension === 'pdf',
    },
    {
      id: 'text',
      label: '文本与文章',
      test: (b) => ['txt', 'md', 'markdown', 'html', 'htm'].includes(b.extension),
    },
    {
      id: 'comic',
      label: '漫画',
      test: (b) => ['cbz', 'cbr'].includes(b.extension),
    },
  ];
  const currentFormat = formats.find((f) => f.id === format);
  const visible = React.useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const type = formats.find((f) => f.id === format);
    return books
      .filter(
        (b) =>
          (!type || type.test(b)) &&
          (section === 'all' ||
            (section === 'reading' && b.lastOpenedAt && (b.progress || 0) < 0.99) ||
            (section === 'finished' && (b.progress || 0) >= 0.99) ||
            (section === 'marked' && (b.bookmarks?.length || b.annotations?.length))) &&
          (!term || `${b.title} ${b.author} ${b.extension}`.toLocaleLowerCase().includes(term)),
      )
      .sort((a, b) =>
        sort === 'title'
          ? a.title.localeCompare(b.title, 'zh-CN')
          : sort === 'author'
            ? (a.author || '').localeCompare(b.author || '', 'zh-CN')
            : sort === 'recent'
              ? (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0)
              : (b.addedAt || 0) - (a.addedAt || 0),
      );
  }, [books, query, section, format, sort]);
  React.useEffect(() => {
    try {
      localStorage.setItem('clearleaf.ui.view', view);
      localStorage.setItem('clearleaf.ui.sort', sort);
    } catch {}
  }, [view, sort]);
  React.useEffect(() => {
    const key = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        input.current?.click();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const select = (id) => {
    setSection(id);
    setFormat('all');
  };
  const importFiles = (event) => {
    const files = Array.from(event.currentTarget.files || []);
    const paths = files.map((file) => window.clearleaf.getFilePath(file)).filter(Boolean);
    event.currentTarget.value = '';
    if (paths.length) onImportPaths(paths);
    else if (files.length) onImport();
  };
  const title = currentFormat?.label || nav.find((n) => n.id === section)?.label || '我的书库';
  return (
    <div className="cl-library">
      <input
        ref={input}
        className="native-file-input"
        type="file"
        accept={BOOK_ACCEPT}
        multiple
        onChange={importFiles}
      />
      <aside className="cl-sidebar">
        <div className="cl-brand">
          <img src="./app-icon.png" alt="" />
          <div>
            <strong>澄页</strong>
            <span>Clearleaf</span>
          </div>
        </div>
        <p className="cl-nav-label">我的书库</p>
        <nav aria-label="书库导航" className="cl-nav">
          {nav.map((item) => (
            <button
              aria-label={item.label}
              title={item.label}
              key={item.id}
              className={`cl-nav-item ${section === item.id && format === 'all' ? 'is-active' : ''}`}
              aria-current={section === item.id && format === 'all' ? 'page' : undefined}
              onClick={() => select(item.id)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              <small>{item.count}</small>
            </button>
          ))}
        </nav>
        {books.length > 0 && (
          <>
            <p className="cl-nav-label cl-format-label">按格式浏览</p>
            <nav aria-label="格式分类" className="cl-nav">
              {formats
                .filter((f) => books.some(f.test))
                .map((item) => (
                  <button
                    aria-label={item.label}
                    title={item.label}
                    key={item.id}
                    className={`cl-nav-item ${format === item.id ? 'is-active' : ''}`}
                    aria-current={format === item.id ? 'page' : undefined}
                    onClick={() => {
                      setSection('all');
                      setFormat(item.id);
                    }}
                  >
                    <ListTree size={18} />
                    <span>{item.label}</span>
                    <small>{books.filter(item.test).length}</small>
                  </button>
                ))}
            </nav>
          </>
        )}
        <div className="cl-sidebar-bottom">
          <button
            className="cl-appearance"
            onClick={onToggleTheme}
            aria-label={appTheme === 'dark' ? '切换主页为浅色模式' : '切换主页为黑暗模式'}
          >
            {appTheme === 'dark' ? <SunMedium size={19} /> : <Moon size={19} />}
            <span>{appTheme === 'dark' ? '浅色模式' : '深色模式'}</span>
          </button>
          <div className="cl-local">
            <span className="cl-status-dot" />
            <div>
              <strong>本地图书馆</strong>
              <span>你的书，留在你的电脑</span>
            </div>
          </div>
        </div>
      </aside>
      <header className="cl-titlebar drag-region">
        <span className="cl-breadcrumb">
          书库 <span>/</span> {title}
        </span>
        <WindowControls />
      </header>
      <main className="cl-main">
        <header className="cl-heading">
          <div>
            <p className="cl-kicker">留一点时间，给阅读</p>
            <h1>{section === 'all' && format === 'all' ? '我的书库' : title}</h1>
            <p className="cl-subtitle">
              {books.length
                ? `${visible.length} 本图书${section === 'marked' ? ' · 留下的思考，随时重温' : ''}`
                : '从一本好书开始，慢慢装满你的书架。'}
            </p>
          </div>
          <button className="cl-import" disabled={importing} onClick={() => input.current?.click()}>
            <FilePlus2 size={18} />
            <span>{importing ? '正在导入…' : '导入图书'}</span>
          </button>
        </header>
        {recent && section === 'all' && format === 'all' && !query && (
          <section className="cl-continue" aria-label="继续阅读">
            <button
              className="cl-continue-cover"
              onClick={() => onOpen(recent)}
              aria-label={`继续阅读《${recent.title}》`}
            >
              <img src={recent.cover} alt="" />
            </button>
            <div className="cl-continue-copy">
              <span className="cl-section-eyebrow">
                {(recent.progress || 0) >= 0.99 ? '最近阅读' : '继续上次阅读'}
              </span>
              <h2>{recent.title}</h2>
              <p>{recent.currentChapter || recent.author}</p>
              <div className="cl-continue-progress">
                <span
                  style={{
                    width: `${Math.max(1, (recent.progress || 0) * 100)}%`,
                  }}
                />
              </div>
              <span className="cl-continue-caption">
                已读 {Math.round((recent.progress || 0) * 100)}%<span> · {recent.author}</span>
              </span>
            </div>
            <button className="cl-continue-button" onClick={() => onOpen(recent)}>
              <BookOpen size={18} />
              <span>{(recent.progress || 0) >= 0.99 ? '再次阅读' : '继续阅读'}</span>
            </button>
          </section>
        )}
        {books.length > 0 && (
          <div className="cl-toolbar">
            <label className="cl-search">
              <Search size={18} />
              <input
                ref={search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索书名或作者"
                aria-label="搜索图书"
              />
              {query ? (
                <button aria-label="清除搜索" onClick={() => setQuery('')}>
                  <X size={15} />
                </button>
              ) : (
                <kbd>Ctrl F</kbd>
              )}
            </label>
            <div className="cl-toolbar-actions">
              <label className="cl-sort">
                <span>排序</span>
                <select
                  aria-label="图书排序"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="added">最近加入</option>
                  <option value="recent">最近阅读</option>
                  <option value="title">书名</option>
                  <option value="author">作者</option>
                </select>
              </label>
              <div className="cl-view-switch" aria-label="书库展示方式">
                <button
                  className={view === 'grid' ? 'is-active' : ''}
                  aria-label="网格视图"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <Grid2x2 size={18} />
                </button>
                <button
                  className={view === 'list' ? 'is-active' : ''}
                  aria-label="列表视图"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        {visible.length ? (
          <section
            className={`book-collection cl-collection ${view === 'list' ? 'cl-list' : ''}`}
            aria-label="图书列表"
          >
            {visible.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                onOpen={() => onOpen(book)}
                onRemove={() => onRemove(book)}
              />
            ))}
          </section>
        ) : (
          <section className="cl-empty">
            <div className="cl-empty-icon">
              <BookOpen size={36} />
            </div>
            <h2>
              {!books.length
                ? '下一段故事，从这里开始'
                : query
                  ? '没有找到这本书'
                  : section === 'reading'
                    ? '还没有正在阅读的图书'
                    : section === 'finished'
                      ? '好书值得慢慢读'
                      : section === 'marked'
                        ? '留下你喜欢的句子'
                        : '这里还没有图书'}
            </h2>
            <p>
              {!books.length
                ? '把 EPUB 拖到这里，或选择本地图书。'
                : query
                  ? '试试其他书名、作者或文件格式。'
                  : section === 'marked'
                    ? '阅读时添加书签或批注，相关图书就会出现在这里。'
                    : section === 'finished'
                      ? '读完的图书会自动收集在这里。'
                      : '打开书库中的一本书，开始阅读。'}
            </p>
            {!books.length ? (
              <button className="cl-import" onClick={() => input.current?.click()}>
                <FilePlus2 size={18} />
                选择本地图书
              </button>
            ) : (
              <button
                className="cl-empty-link"
                onClick={() => {
                  setQuery('');
                  select('all');
                }}
              >
                查看全部图书
              </button>
            )}
            {!books.length && (
              <span className="cl-supported">EPUB · PDF · TXT · MOBI · 更多格式</span>
            )}
          </section>
        )}
        {books.length > 0 && (
          <footer className="cl-library-footer">
            <span>{books.length} 本藏书 · 本地保存</span>
            <span>拖入图书即可加入书库</span>
          </footer>
        )}
      </main>
    </div>
  );
}
export default LibraryScreen;
