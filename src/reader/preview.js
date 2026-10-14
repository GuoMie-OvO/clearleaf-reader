import '../styles/app.css';
const foliateReady = import(new URL('./foliate/view.js', document.baseURI).href);
let view, bookKey, location, layoutKey;
const twoFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const types = {
  epub: 'application/epub+zip',
  txt: 'text/plain',
  pdf: 'application/pdf',
  mobi: 'application/x-mobipocket-ebook',
  azw3: 'application/vnd.amazon.ebook',
  fb2: 'application/x-fictionbook+xml',
  cbz: 'application/vnd.comicbook+zip',
  html: 'text/html',
  htm: 'text/html',
  md: 'text/markdown',
  markdown: 'text/markdown',
};
window.clearleafPreview = {
  async render(request) {
    const { makeBook } = await foliateReady;
    const root = document.querySelector('#preview');
    root.className = `reader-screen theme-${request.theme}`;
    if (bookKey !== request.path) {
      view?.close();
      layoutKey = null;
      const raw = await window.clearleaf.readBook(request.path);
      let file;
      if (raw.extension === 'cbr') {
        const data = await window.clearleaf.convertCbr(request.path);
        file = new File([data.data], data.name, {
          type: types.cbz,
        });
      } else
        file = new File([raw.data], raw.name, {
          type: types[raw.extension] || 'application/octet-stream',
        });
      const book = ['txt', 'html', 'htm', 'md', 'markdown'].includes(raw.extension)
        ? await (await import('../books/text.js')).createTextBook(file, raw)
        : await makeBook(file);
      view = document.createElement('foliate-view');
      view.className = 'foliate-reader';
      document.querySelector('.foliate-host').replaceChildren(view);
      view.addEventListener('relocate', (e) => (location = e.detail.cfi));
      await view.open(book);
      bookKey = request.path;
    }
    const renderer = view.renderer;
    renderer.setAttribute('data-external-page-gestures', '');
    const nextLayoutKey = JSON.stringify([
      request.attributes,
      request.styles,
      request.theme,
      request.brightness,
    ]);
    const layoutChanged = layoutKey !== nextLayoutKey;
    if (layoutChanged) {
      renderer.removeAttribute('animated');
      for (const [name, value] of Object.entries(request.attributes))
        if (renderer.getAttribute(name) !== String(value))
          renderer.setAttribute(name, String(value));
      renderer.setStyles(request.styles);
      view.style.setProperty('--reader-brightness', String(request.brightness));
      layoutKey = nextLayoutKey;
    }
    const moved = location !== request.cfi;
    if (moved) await view.goTo(request.cfi);
    if (moved || layoutChanged) {
      for (const { doc } of renderer.getContents()) await doc?.fonts?.ready;
      await twoFrames();
    }
    if (request.direction === 'next') await view.goRight();
    else if (request.direction === 'prev') await view.goLeft();
    for (const { doc } of renderer.getContents()) await doc?.fonts?.ready;
    await twoFrames();
    return {
      location,
      index: renderer.getContents()[0]?.index ?? 0,
      page: renderer.page,
      atStart: renderer.atStart,
      atEnd: renderer.atEnd,
    };
  },
};
