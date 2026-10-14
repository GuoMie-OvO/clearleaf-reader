import { titleFromFilename, readBookFile } from './files.js';
import { loadFoliate } from '../lib/foliate.js';
import { resizeCover, createFallbackCover } from './covers.js';
async function extractBookMetadata(t) {
  const i = titleFromFilename(t.name);
  let l = i;
  let s = '';
  let o;
  if (!['txt', 'html', 'htm', 'md', 'markdown', 'pdf'].includes(t.extension))
    try {
      const h = await readBookFile(t);
      const { makeBook: d } = await loadFoliate();
      const p = await d(h);
      l = metadataToText(p.metadata?.title) || i;
      s = metadataToText(p.metadata?.author);
      const m = await Promise.resolve(p.getCover?.());
      m && (o = await resizeCover(m));
      p.destroy?.();
    } catch (h) {
      const d =
        h && typeof h == 'object'
          ? `${String(h.name ?? 'Error')}: ${String(h.message ?? '')}
${String(h.stack ?? '')}`
          : String(h);
      console.warn('Metadata extraction failed', d);
    }
  o ??= await createFallbackCover(l, s, t.extension);
  const c = await createBookId(t.path, t.modifiedAt);
  return {
    ...t,
    id: c,
    title: l,
    author: s || '未知作者',
    cover: o,
    addedAt: Date.now(),
    progress: 0,
    bookmarks: [],
    annotations: [],
  };
}
const metadataToText = (t) => {
  if (!t) return '';
  if (typeof t == 'string') return t;
  if (Array.isArray(t)) return t.map(metadataToText).filter(Boolean).join('、');
  if (typeof t == 'object') {
    if (t.name) return metadataToText(t.name);
    const i = Object.values(t)[0];
    return metadataToText(i);
  }
  return String(t);
};
async function createBookId(t, i) {
  const l = `${t.toLowerCase()}|${i}`;
  try {
    const s = new TextEncoder().encode(l);
    const o = await crypto.subtle.digest('SHA-256', s);
    return [...new Uint8Array(o)]
      .slice(0, 12)
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    let s = 2166136261;
    let o = 2654435769;
    for (const c of l) {
      s = Math.imul(s ^ c.charCodeAt(0), 16777619);
      o = Math.imul(o ^ c.charCodeAt(0), 2246822507);
    }
    return `${s >>> 0}${o >>> 0}${l.length}`.replaceAll('-', '').padEnd(24, '0').slice(0, 24);
  }
} /*! @license DOMPurify 3.4.14 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.14/LICENSE */

export { extractBookMetadata, metadataToText, createBookId };
