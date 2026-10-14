import React from 'react';
import { FilePlus2, Undo2, CircleCheck } from 'lucide-react';
import LibraryScreen from './library/LibraryScreen.jsx';
import { DEFAULT_LIBRARY, DEFAULT_SETTINGS, VALID_THEMES } from './config/defaults.js';
import { extractBookMetadata, createBookId } from './books/metadata.js';
import { titleFromFilename } from './books/files.js';
import { createFallbackCover } from './books/covers.js';
import { ReaderPage } from './reader/ReaderPage.jsx';
function App() {
  const [library, setLibrary] = React.useState(DEFAULT_LIBRARY);
  const libraryRef = React.useRef(library);
  const [loaded, setLoaded] = React.useState(!1);
  const [selectedBookId, setSelectedBookId] = React.useState(null);
  const [importing, setImporting] = React.useState(!1);
  const [dragOver, setDragOver] = React.useState(!1);
  const [removedBook, setRemovedBook] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const toastTimerRef = React.useRef(null);
  const importQueueRef = React.useRef(Promise.resolve());
  libraryRef.current = library;
  const showNotice = React.useCallback((K) => {
    setNotice(K);
    toastTimerRef.current && window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setNotice(''), 2600);
  }, []);
  React.useEffect(
    () => (
      window.clearleaf.loadLibrary().then((K) => {
        const d0 = K.settings ?? DEFAULT_SETTINGS;
        const o0 = {
          ...DEFAULT_SETTINGS,
          ...d0,
          theme: VALID_THEMES.has(d0.theme) ? d0.theme : 'paper',
        };
        const y0 = Array.isArray(K.books)
          ? K.books.map((z) => ({
              ...z,
              bookmarks: z.bookmarks ?? [],
              annotations: z.annotations ?? [],
              progress: z.progress ?? 0,
            }))
          : [];
        const w0 = K.appTheme === 'dark' ? 'dark' : 'light';
        setLibrary({
          version: 1,
          books: y0,
          appTheme: w0,
          settings: o0,
        });
        setLoaded(!0);
      }),
      () => {
        toastTimerRef.current && window.clearTimeout(toastTimerRef.current);
      }
    ),
    [],
  );
  React.useEffect(() => {
    if (!loaded) return;
    const K = window.setTimeout(() => void window.clearleaf.saveLibrary(library), 320);
    return () => window.clearTimeout(K);
  }, [loaded, library]);
  const importDescriptors = React.useCallback(
    async (K, d0 = !1) => {
      if (!K.length) return;
      setImporting(!0);
      const o0 = [...libraryRef.current.books];
      let y0 = null;
      let w0 = 0;
      try {
        for (const z of K) {
          const t0 = o0.find(
            (b0) =>
              b0.path.toLocaleLowerCase() === z.path.toLocaleLowerCase() &&
              b0.modifiedAt === z.modifiedAt,
          );
          if (t0) {
            y0 ??= t0;
            continue;
          }
          let Q;
          try {
            Q = await extractBookMetadata(z);
          } catch (b0) {
            console.warn('Falling back to basic book metadata', b0);
            const E = titleFromFilename(z.name);
            Q = {
              ...z,
              id: await createBookId(z.path, z.modifiedAt),
              title: E,
              author: '未知作者',
              cover: await createFallbackCover(E, '', z.extension),
              addedAt: Date.now(),
              progress: 0,
              bookmarks: [],
              annotations: [],
            };
          }
          const m0 = o0.findIndex(
            (b0) => b0.path.toLocaleLowerCase() === z.path.toLocaleLowerCase(),
          );
          m0 >= 0
            ? o0.splice(m0, 1, {
                ...Q,
                addedAt: o0[m0].addedAt,
              })
            : o0.unshift(Q);
          y0 ??= Q;
          w0 += 1;
          setLibrary((b0) => ({
            ...b0,
            books: [...o0],
          }));
        }
        showNotice(w0 ? `已导入 ${w0} 本图书` : '这些图书已经在书库中');
        d0 && y0 && setSelectedBookId(y0.id);
      } catch (z) {
        console.error(z);
        showNotice(z instanceof Error ? z.message : '导入失败');
      } finally {
        setImporting(!1);
      }
    },
    [showNotice],
  );
  const chooseBooks = React.useCallback(async () => {
    try {
      await importDescriptors(await window.clearleaf.openBooks());
    } catch (K) {
      console.error(K);
      showNotice(K instanceof Error ? `无法选择图书：${K.message}` : '无法打开文件选择器');
    }
  }, [importDescriptors, showNotice]);
  const importPaths = React.useCallback(
    (K, d0 = !0) => {
      if (!K.length) return Promise.resolve();
      const o0 = importQueueRef.current.then(async () => {
        try {
          const y0 = await window.clearleaf.describeBooks(K);
          if (!y0.length) throw new Error('没有识别到支持的图书文件');
          await importDescriptors(y0, d0);
        } catch (y0) {
          console.error(y0);
          showNotice(y0 instanceof Error ? `导入失败：${y0.message}` : '导入失败，请重新选择文件');
        }
      });
      importQueueRef.current = o0.catch(() => {});
      return o0;
    },
    [importDescriptors, showNotice],
  );
  React.useEffect(() => {
    if (loaded) {
      window.clearleaf.getLaunchFiles().then((K) => importPaths(K, !0));
      return window.clearleaf.onOpenRequested((K) => void importPaths(K, !0));
    }
  }, [loaded, importPaths]);
  React.useEffect(() => {
    let K = 0;
    const d0 = (Q) => Array.from(Q.dataTransfer?.types ?? []).includes('Files');
    const o0 = () => {
      window.clearTimeout(K);
      K = window.setTimeout(() => setDragOver(!1), 900);
    };
    const y0 = (Q) => {
      d0(Q) && (Q.preventDefault(), setDragOver(!0), o0());
    };
    const w0 = (Q) => {
      d0(Q) && (Q.preventDefault(), setDragOver(!0), o0());
    };
    const z = (Q) => {
      Q.preventDefault();
      Q.relatedTarget == null && setDragOver(!1);
    };
    const t0 = (Q) => {
      if (
        (Q.preventDefault(), window.clearTimeout(K), setDragOver(!1), !Q.dataTransfer?.files.length)
      )
        return;
      let m0;
      try {
        m0 = window.clearleaf.getDroppedPaths(Array.from(Q.dataTransfer.files));
      } catch (b0) {
        console.error('Could not resolve dropped files', b0);
        showNotice('无法读取拖入文件，请改用“导入图书”按钮');
        return;
      }
      if (!m0.length) {
        showNotice('无法读取拖入文件，请改用“导入图书”按钮');
        return;
      }
      importPaths(m0, !0);
    };
    window.addEventListener('dragover', y0, !0);
    window.addEventListener('dragenter', w0, !0);
    window.addEventListener('dragleave', z, !0);
    window.addEventListener('drop', t0, !0);
    return () => {
      window.clearTimeout(K);
      window.removeEventListener('dragover', y0, !0);
      window.removeEventListener('dragenter', w0, !0);
      window.removeEventListener('dragleave', z, !0);
      window.removeEventListener('drop', t0, !0);
    };
  }, [importPaths, showNotice]);
  const currentBook = React.useMemo(
    () => library.books.find((K) => K.id === selectedBookId) ?? null,
    [selectedBookId, library.books],
  );
  const updateCurrentBook = React.useCallback(
    (K) => {
      selectedBookId &&
        setLibrary((d0) => ({
          ...d0,
          books: d0.books.map((o0) =>
            o0.id === selectedBookId
              ? {
                  ...o0,
                  ...K,
                }
              : o0,
          ),
        }));
    },
    [selectedBookId],
  );
  const updateSettings = React.useCallback(
    (K) =>
      setLibrary((d0) => ({
        ...d0,
        settings: K,
      })),
    [],
  );
  const toggleAppTheme = React.useCallback(
    () =>
      setLibrary((K) => ({
        ...K,
        appTheme: K.appTheme === 'dark' ? 'light' : 'dark',
      })),
    [],
  );
  const removeBook = (K) => {
    setLibrary((d0) => ({
      ...d0,
      books: d0.books.filter((o0) => o0.id !== K.id),
    }));
    setRemovedBook(K);
    toastTimerRef.current && window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setRemovedBook(null), 5e3);
  };
  const undoRemove = () => {
    removedBook &&
      (setLibrary((K) => ({
        ...K,
        books: [removedBook, ...K.books],
      })),
      setRemovedBook(null));
  };
  return loaded ? (
    <div
      className={`app-root app-theme-${library.appTheme}`}
      data-reduce-motion={Boolean(library.settings.reduceMotion)}
    >
      {currentBook ? (
        <div className="screen-layer" key={`reader-${currentBook.id}`}>
          <ReaderPage
            book={currentBook}
            settings={library.settings}
            onBack={() => setSelectedBookId(null)}
            onUpdateBook={updateCurrentBook}
            onUpdateSettings={updateSettings}
          />
        </div>
      ) : (
        <div className="screen-layer" key={'library'}>
          <LibraryScreen
            books={library.books}
            importing={importing}
            appTheme={library.appTheme}
            onToggleTheme={toggleAppTheme}
            onImport={chooseBooks}
            onImportPaths={(K) => importPaths(K, !1)}
            onOpen={(K) => setSelectedBookId(K.id)}
            onRemove={removeBook}
          />
        </div>
      )}
      {dragOver && (
        <div className="drop-overlay">
          <div>
            <FilePlus2 size={36} />
            <h2>{'松手即可加入书库'}</h2>
            <p>{'文件仍保留在原来的位置'}</p>
          </div>
        </div>
      )}
      {(notice || removedBook) && (
        <div className="app-toast surface-panel">
          {removedBook ? (
            <React.Fragment>
              <Undo2 size={17} />
              <span>
                {'已从书库移除《'}
                {removedBook.title}
                {'》'}
              </span>
              <button onClick={undoRemove}>{'撤销'}</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <CircleCheck size={17} />
              <span>{notice}</span>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="app-boot">
      <span className="brand-icon large">
        <img src="./app-icon.png" alt="" />
      </span>
      <p>{'正在整理书架…'}</p>
    </div>
  );
}
export { App };
