import { useReaderSearch } from './hooks/useReaderSearch.js';
import { useReaderTts } from './hooks/useReaderTts.js';
import { useWindowDrag } from './hooks/useWindowDrag.js';
import { ReaderToolbar } from './components/ReaderToolbar.jsx';
import { ReaderStage } from './components/ReaderStage.jsx';
import { ReaderFooter } from './components/ReaderFooter.jsx';
import { ReaderSheet } from './components/ReaderSheet.jsx';
import { SelectionToolbar } from './components/SelectionToolbar.jsx';
import React from 'react';
import { buildReaderStyles } from './styles.js';
import { loadOverlayer, loadFoliate } from '../lib/foliate.js';
import { readBookFile } from '../books/files.js';
import { flattenToc } from '../lib/toc.js';
function ReaderPage({ book, settings, onBack, onUpdateBook, onUpdateSettings }) {
  const pageTurns = React.useRef(null);
  const hostRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const viewRef = React.useRef(null);
  const bookRef = React.useRef(book);
  const settingsRef = React.useRef(settings);
  const panelRef = React.useRef(null);
  const turnRef = React.useRef(() => {});
  const chromeTimerRef = React.useRef(null);
  const saveThrottleRef = React.useRef(0);
  const locationRef = React.useRef({
    progress: book.progress,
    cfi: book.location,
    chapter: book.currentChapter ?? '',
  });
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fixedLayout, setFixedLayout] = React.useState(false);
  const [panel, setPanel] = React.useState(null);
  const [chromeVisible, setChromeVisible] = React.useState(true);
  const [toc, setToc] = React.useState([]);
  const [progress, setProgress] = React.useState(book.progress);
  const [chapter, setChapter] = React.useState(book.currentChapter ?? '');
  const [selection, setSelection] = React.useState(null);
  const [activeAnnotation, setActiveAnnotation] = React.useState(null);
  const [fadePulse, setFadePulse] = React.useState(false);
  const { searchQuery, setSearchQuery, searching, searchProgress, searchResults, searchBook } =
    useReaderSearch({
      viewRef,
    });
  const { ttsStatus, toggleTts, stopTts } = useReaderTts({
    viewRef,
    settingsRef,
  });
  const { startWindowDrag, moveWindowDrag, endWindowDrag } = useWindowDrag();
  bookRef.current = book;
  settingsRef.current = settings;
  panelRef.current = panel;
  const applyLayout = React.useCallback((D) => {
    const P = viewRef.current;
    if (!P?.renderer) return;
    const n0 = P.renderer;
    const C0 = rootRef.current?.getBoundingClientRect();
    const S0 = Math.max(320, Math.round(C0?.width ?? window.innerWidth));
    const p1 = Math.max(280, Math.round(C0?.height ?? window.innerHeight));
    if (P.isFixedLayout) n0.setAttribute('zoom', 'fit-page');
    else {
      const g0 = S0 / p1 >= 1.16;
      const v0 = D.columns === 2 && g0 && S0 >= 980 ? 2 : 1;
      const O0 = Math.round(
        Math.max(16, Math.min(D.margin, S0 * (v0 === 2 ? 0.035 : 0.075), p1 * 0.105)),
      );
      const P0 = Math.max(280, S0 - O0 * 2);
      const I0 = Math.max(280, Math.floor(P0 / v0));
      const q0 = Math.max(300, p1 - O0 * 2);
      n0.setAttribute('flow', D.mode === 'scroll' ? 'scrolled' : 'paginated');
      n0.setAttribute('margin', `${O0}px`);
      n0.setAttribute('gap', `${Math.max(3, Math.min(7, Math.round(O0 / 8)))}%`);
      n0.setAttribute('max-inline-size', `${I0}px`);
      n0.setAttribute('max-block-size', `${q0}px`);
      n0.setAttribute('max-column-count', String(v0));
      D.mode === 'slide' && !D.reduceMotion
        ? n0.setAttribute('animated', '')
        : n0.removeAttribute('animated');
      n0.setStyles?.(buildReaderStyles(D));
    }
    P.style.setProperty('--reader-brightness', String(D.brightness));
  }, []);
  React.useEffect(() => {
    const D = window.setTimeout(() => applyLayout(settings), 70);
    return () => window.clearTimeout(D);
  }, [applyLayout, settings]);
  React.useEffect(() => {
    const D = rootRef.current;
    if (!D) return;
    let P = 0;
    const n0 = new ResizeObserver((C0) => {
      const { width: S0, height: p1 } = C0[0]?.contentRect ?? D.getBoundingClientRect();
      D.dataset.viewport = S0 < 760 ? 'compact' : S0 < 1040 ? 'medium' : 'large';
      D.dataset.aspect =
        S0 / Math.max(1, p1) > 1.55 ? 'wide' : p1 / Math.max(1, S0) > 1.2 ? 'tall' : 'balanced';
      cancelAnimationFrame(P);
      P = requestAnimationFrame(() => applyLayout(settingsRef.current));
    });
    n0.observe(D);
    return () => {
      cancelAnimationFrame(P);
      n0.disconnect();
    };
  }, [applyLayout]);
  const showChrome = React.useCallback(() => {
    setChromeVisible(true);
    chromeTimerRef.current && window.clearTimeout(chromeTimerRef.current);
    settingsRef.current.autoHideUi &&
      !panelRef.current &&
      (chromeTimerRef.current = window.setTimeout(() => setChromeVisible(false), 2400));
  }, []);
  React.useEffect(() => {
    panel ? setChromeVisible(true) : showChrome();
  }, [panel, showChrome]);
  const drawAnnotation = React.useCallback(async (D) => {
    const P = D.detail;
    const { Overlayer: n0 } = await loadOverlayer();
    P.draw(n0.highlight, {
      color: P.annotation.color ?? '#ffd75e',
    });
  }, []);
  const attachContentEvents = React.useCallback((D, P) => {
    D.addEventListener('pdf-render-error', (g0) => {
      const v0 = String(g0.detail?.message ?? '页面内容无法绘制');
      setReady(false);
      setError(`PDF \u9875\u9762\u6E32\u67D3\u5931\u8D25\uFF1A${v0}`);
      setChromeVisible(true);
    });
    const n0 = () => {
      window.setTimeout(() => {
        const g0 = D.defaultView?.getSelection();
        if (!g0 || g0.isCollapsed || !g0.rangeCount) return setSelection(null);
        const v0 = g0.toString().trim();
        if (!v0) return setSelection(null);
        const O0 = g0.getRangeAt(0).cloneRange();
        const P0 = O0.getBoundingClientRect();
        const q0 = D.defaultView?.frameElement?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
        };
        setSelection({
          range: O0,
          index: P,
          text: v0.slice(0, 1e3),
          x: q0.left + P0.left + P0.width / 2,
          y: q0.top + P0.top,
          selection: g0,
        });
        setChromeVisible(true);
      }, 0);
    };
    D.addEventListener('mouseup', n0);
    D.addEventListener('touchend', n0);
    D.addEventListener('keydown', (event) => {
      if (event.target?.closest('input,textarea,select,[contenteditable]')) return;
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setPanel('search');
        return;
      }
      if (event.key === 'F11') {
        event.preventDefault();
        window.clearleaf.window.toggleFullscreen();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setChromeVisible((value) => !value);
        return;
      }
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
        if (settingsRef.current.mode !== 'scroll' || event.key !== ' ') event.preventDefault();
        turnRef.current('next', {
          instant: true,
        });
      } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        turnRef.current('prev', {
          instant: true,
        });
      }
    });
  }, []);
  React.useEffect(() => {
    let D = false;
    const P = hostRef.current;
    if (!P) return;
    const n0 = document.createElement('foliate-view');
    n0.className = 'foliate-reader';
    viewRef.current = n0;
    P.replaceChildren(n0);
    setReady(false);
    setError('');
    const C0 = (v0) => {
      const O0 = v0.detail;
      const P0 = Number.isFinite(O0.fraction)
        ? Math.max(0, Math.min(1, O0.fraction))
        : locationRef.current.progress;
      const I0 = String(O0.tocItem?.label ?? O0.pageItem?.label ?? '');
      locationRef.current = {
        cfi: O0.cfi,
        progress: P0,
        chapter: I0,
      };
      setProgress(P0);
      I0 && setChapter(I0);
      const q0 = Date.now();
      q0 - saveThrottleRef.current > 650 &&
        ((saveThrottleRef.current = q0),
        onUpdateBook({
          progress: P0,
          location: O0.cfi,
          currentChapter: I0,
          lastOpenedAt: q0,
        }));
    };
    const S0 = (v0) => {
      const { doc: O0, index: P0 } = v0.detail;
      attachContentEvents(O0, P0);
    };
    const p1 = async (v0) => {
      const O0 = v0.detail.index;
      for (const P0 of bookRef.current.annotations)
        try {
          n0.resolveNavigation(P0.cfi)?.index === O0 &&
            (await n0.addAnnotation({
              ...P0,
              value: P0.cfi,
            }));
        } catch {}
    };
    const g0 = (v0) => {
      const O0 = v0.detail.value;
      setActiveAnnotation(O0);
      setPanel('notes');
    };
    n0.addEventListener('relocate', C0);
    n0.addEventListener('load', S0);
    n0.addEventListener('create-overlay', p1);
    n0.addEventListener('draw-annotation', drawAnnotation);
    n0.addEventListener('show-annotation', g0);
    (async () => {
      try {
        await loadFoliate();
        const v0 = await readBookFile(book);
        if (D) return;
        if (['txt', 'html', 'htm', 'md', 'markdown'].includes(book.extension)) {
          const { createTextBook } = await import('../books/text.js');
          const O0 = await createTextBook(v0, book, book.title);
          await n0.open(O0);
        } else await n0.open(v0);
        if (D) {
          n0.close?.();
          return;
        }
        setFixedLayout(!!n0.isFixedLayout);
        setToc(flattenToc(n0.book?.toc ?? []));
        applyLayout(settingsRef.current);
        await n0.init({
          lastLocation: book.location,
          showTextStart: true,
        });
        for (const { doc } of n0.renderer.getContents()) await doc?.fonts?.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (D) return;
        onUpdateBook({
          lastOpenedAt: Date.now(),
        });
        setReady(true);
        showChrome();
      } catch (v0) {
        if (D) {
          n0.close?.();
          return;
        }
        const O0 =
          v0 && typeof v0 == 'object'
            ? `${String(v0.name ?? 'Error')}: ${String(v0.message ?? '')}
${String(v0.stack ?? '')}`
            : String(v0);
        console.error('Reader open failed', O0);
        setError(v0 instanceof Error ? v0.message : '无法打开这本书');
      }
    })();
    return () => {
      D = true;
      chromeTimerRef.current && window.clearTimeout(chromeTimerRef.current);
      stopTts();
      speechSynthesis.cancel();
      const v0 = locationRef.current;
      v0.cfi &&
        onUpdateBook({
          progress: v0.progress,
          location: v0.cfi,
          currentChapter: v0.chapter,
        });
      n0.removeEventListener('relocate', C0);
      n0.removeEventListener('load', S0);
      n0.removeEventListener('create-overlay', p1);
      n0.removeEventListener('draw-annotation', drawAnnotation);
      n0.removeEventListener('show-annotation', g0);
      n0.close?.();
      n0.remove();
      viewRef.current = null;
    };
  }, [book.id]);
  const navigate = React.useCallback(
    async (D) => {
      const P = viewRef.current;
      !P ||
        !ready ||
        (setSelection(null),
        settingsRef.current.mode === 'fade' &&
          !settingsRef.current.reduceMotion &&
          (setFadePulse(true), window.setTimeout(() => setFadePulse(false), 260)),
        settingsRef.current.mode === 'scroll'
          ? D === 'next'
            ? await P.next()
            : await P.prev()
          : D === 'next'
            ? await P.goRight()
            : await P.goLeft());
    },
    [ready],
  );
  const turnPage = React.useCallback(
    (direction, settings = {}) =>
      pageTurns.current ? pageTurns.current.turn(direction, settings) : navigate(direction),
    [navigate],
  );
  turnRef.current = turnPage;
  React.useEffect(() => {
    if (!ready || !viewRef.current) return;
    let disposed = false;
    import('./page-turn-controller.js')
      .then(({ createPageTurnController }) => {
        if (disposed || !rootRef.current || !viewRef.current) return;
        pageTurns.current = createPageTurnController({
          root: rootRef.current,
          view: viewRef.current,
          path: book.path,
          getLocation: () => locationRef.current.cfi,
          getSettings: () => settingsRef.current,
          getStyles: () => buildReaderStyles(settingsRef.current),
          isBlocked: () => Boolean(panelRef.current),
          navigate: (direction) => navigate(direction),
          centerTap: () => {
            window.clearTimeout(chromeTimerRef.current);
            setChromeVisible((value) => !value);
          },
        });
      })
      .catch((error) => console.warn('Page gestures unavailable', error));
    return () => {
      disposed = true;
      pageTurns.current?.destroy();
      pageTurns.current = null;
    };
  }, [ready, book.id, navigate]);
  React.useEffect(() => {
    const timer = setTimeout(() => pageTurns.current?.invalidate(), 140);
    return () => clearTimeout(timer);
  }, [settings, panel]);
  const jumpTo = React.useCallback(async (D) => {
    await viewRef.current?.goTo(D);
  }, []);
  React.useEffect(() => {
    const D = (P) => {
      P.target.matches('input, textarea, select') ||
        (P.ctrlKey && P.key.toLowerCase() === 'f'
          ? (P.preventDefault(), setPanel('search'))
          : P.key === 'F11'
            ? (P.preventDefault(), window.clearleaf.window.toggleFullscreen())
            : P.key === 'Escape'
              ? panel
                ? setPanel(null)
                : selection
                  ? setSelection(null)
                  : setChromeVisible((C0) => !C0)
              : P.key === 'ArrowRight' || P.key === 'PageDown' || P.key === ' '
                ? ((settingsRef.current.mode !== 'scroll' || P.key !== ' ') && P.preventDefault(),
                  turnPage('next', {
                    instant: true,
                  }))
                : (P.key === 'ArrowLeft' || P.key === 'PageUp') &&
                  (P.preventDefault(),
                  turnPage('prev', {
                    instant: true,
                  })));
    };
    window.addEventListener('keydown', D);
    return () => window.removeEventListener('keydown', D);
  }, [turnPage, panel, selection]);
  const addHighlight = async (D, P = false) => {
    if (!selection || !viewRef.current) return;
    const n0 = viewRef.current.getCFI(selection.index, selection.range);
    const C0 = {
      id: crypto.randomUUID(),
      cfi: n0,
      text: selection.text,
      note: '',
      color: D,
      sectionIndex: selection.index,
      createdAt: Date.now(),
    };
    const S0 = [...bookRef.current.annotations, C0];
    onUpdateBook({
      annotations: S0,
    });
    await viewRef.current.addAnnotation({
      ...C0,
      value: n0,
    });
    selection.selection.removeAllRanges();
    setSelection(null);
    P && (setActiveAnnotation(n0), setPanel('notes'));
  };
  const deleteHighlight = async (D) => {
    await viewRef.current?.deleteAnnotation({
      ...D,
      value: D.cfi,
    });
    onUpdateBook({
      annotations: bookRef.current.annotations.filter((P) => P.id !== D.id),
    });
    activeAnnotation === D.cfi && setActiveAnnotation(null);
  };
  const updateNote = (D, P) => {
    onUpdateBook({
      annotations: bookRef.current.annotations.map((n0) =>
        n0.id === D.id
          ? {
              ...n0,
              note: P,
            }
          : n0,
      ),
    });
  };
  const toggleBookmark = () => {
    const D = locationRef.current.cfi;
    if (!D) return;
    const P = bookRef.current.bookmarks.find((C0) => C0.cfi === D);
    const n0 = P
      ? bookRef.current.bookmarks.filter((C0) => C0.id !== P.id)
      : [
          ...bookRef.current.bookmarks,
          {
            id: crypto.randomUUID(),
            cfi: D,
            label: chapter || `\u9605\u8BFB\u81F3 ${Math.round(progress * 100)}%`,
            progress,
            createdAt: Date.now(),
          },
        ];
    onUpdateBook({
      bookmarks: n0,
    });
  };
  const hasBookmark = !!(
    locationRef.current.cfi && book.bookmarks.some((D) => D.cfi === locationRef.current.cfi)
  );
  const panelTitle =
    panel === 'toc'
      ? '目录'
      : panel === 'search'
        ? '全文搜索'
        : panel === 'notes'
          ? '书签与批注'
          : '阅读设置';
  return (
    <div
      ref={rootRef}
      className={`reader-screen ${ready ? '' : 'reader-preparing'} theme-${settings.theme} ${chromeVisible || panel ? 'chrome-visible' : 'chrome-hidden'} ${settings.mode === 'scroll' ? 'scroll-mode' : 'page-mode'} ${fadePulse ? 'fade-pulse' : ''}`}
      data-reader-theme={settings.theme}
    >
      <ReaderToolbar
        startWindowDrag={startWindowDrag}
        moveWindowDrag={moveWindowDrag}
        endWindowDrag={endWindowDrag}
        onBack={onBack}
        book={book}
        chapter={chapter}
        panel={panel}
        setPanel={setPanel}
        hasBookmark={hasBookmark}
        toggleBookmark={toggleBookmark}
        ttsStatus={ttsStatus}
        toggleTts={toggleTts}
        stopTts={stopTts}
      />
      <ReaderStage hostRef={hostRef} ready={ready} error={error} book={book} onBack={onBack} />
      <ReaderFooter
        chapter={chapter}
        book={book}
        progress={progress}
        setProgress={setProgress}
        viewRef={viewRef}
      />
      <ReaderSheet
        panel={panel}
        setPanel={setPanel}
        startWindowDrag={startWindowDrag}
        moveWindowDrag={moveWindowDrag}
        endWindowDrag={endWindowDrag}
        book={book}
        panelTitle={panelTitle}
        toc={toc}
        jumpTo={jumpTo}
        searchBook={searchBook}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searching={searching}
        searchProgress={searchProgress}
        searchResults={searchResults}
        viewRef={viewRef}
        onUpdateBook={onUpdateBook}
        activeAnnotation={activeAnnotation}
        setActiveAnnotation={setActiveAnnotation}
        updateNote={updateNote}
        deleteHighlight={deleteHighlight}
        settings={settings}
        fixedLayout={fixedLayout}
        onUpdateSettings={onUpdateSettings}
      />
      <SelectionToolbar
        selection={selection}
        addHighlight={addHighlight}
        setSelection={setSelection}
      />
    </div>
  );
}
export { ReaderPage };
