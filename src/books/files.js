const titleFromFilename = (t) =>
  t.replace(/\.(epub|txt|pdf|mobi|azw3|fb2|cbz|cbr|html?|md|markdown)$/i, '');
const getMimeType = (t) =>
  ({
    epub: 'application/epub+zip',
    pdf: 'application/pdf',
    mobi: 'application/x-mobipocket-ebook',
    azw3: 'application/vnd.amazon.ebook',
    fb2: 'application/x-fictionbook+xml',
    cbz: 'application/vnd.comicbook+zip',
    cbr: 'application/vnd.comicbook-rar',
    txt: 'text/plain',
    html: 'text/html',
    htm: 'text/html',
    md: 'text/markdown',
    markdown: 'text/markdown',
  })[t] ?? 'application/octet-stream';
const readBookFile = async (t) => {
  if (t.extension === 'cbr') {
    const l = await window.clearleaf.convertCbr(t.path);
    return new File([l.data], l.name, {
      type: getMimeType('cbz'),
    });
  }
  const i = await window.clearleaf.readBook(t.path);
  return new File([i.data], i.name, {
    type: getMimeType(i.extension),
  });
};
export { titleFromFilename, getMimeType, readBookFile };
