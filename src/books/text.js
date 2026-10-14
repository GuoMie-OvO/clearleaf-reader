import DOMPurify from 'dompurify';
import charsetDetector from 'jschardet';
import { marked } from 'marked';
import { titleFromFilename } from './files.js';
async function createTextBook(t, i, l) {
  const s = await decodeBookText(t);
  const o = l || titleFromFilename(i.name);
  const c = i.extension;
  let h;
  c === 'md' || c === 'markdown'
    ? (h = await marked.parse(s, {
        async: !0,
        gfm: !0,
      }))
    : c === 'html' || c === 'htm'
      ? (h = s)
      : (h = textParagraphs(s));
  h = sanitizeHtml(h);
  const d = splitChapters(h, o);
  const p = d.map((y, v) => {
    const b = wrapChapterHtml(
      y.title,
      y.html.join(`
`),
    );
    let C = null;
    return {
      id: `section-${v}.xhtml`,
      size: new Blob([b]).size,
      linear: 'yes',
      load: () => (
        (C ??= URL.createObjectURL(
          new Blob([b], {
            type: 'text/html',
          }),
        )),
        C
      ),
      unload: () => {
        C && URL.revokeObjectURL(C);
        C = null;
      },
      createDocument: () => new DOMParser().parseFromString(b, 'text/html'),
      resolveHref: (x) => x,
    };
  });
  const m = d.map((y, v) => ({
    label: y.title,
    href: `section-${v}.xhtml`,
  }));
  return {
    metadata: {
      title: o,
      author: '本地文档',
      language: 'zh-CN',
    },
    sections: p,
    toc: m,
    dir: 'ltr',
    rendition: {
      layout: 'reflowable',
    },
    resolveHref(y) {
      const [v, b] = y.split('#');
      return {
        index: Math.max(
          0,
          p.findIndex((x) => x.id === v),
        ),
        anchor: b ? (x) => x.getElementById(b) : () => 0,
      };
    },
    splitTOCHref: (y) => y?.split('#') ?? [],
    getTOCFragment: (y, v) => y.getElementById(v),
    isExternal: (y) => /^(https?:|mailto:)/i.test(y),
  };
}
const decodeBookText = async (t) => {
  const i = new Uint8Array(await t.arrayBuffer());
  if (i[0] === 239 && i[1] === 187 && i[2] === 191)
    return new TextDecoder('utf-8').decode(i.subarray(3));
  if (i[0] === 255 && i[1] === 254) return new TextDecoder('utf-16le').decode(i.subarray(2));
  if (i[0] === 254 && i[1] === 255) return new TextDecoder('utf-16be').decode(i.subarray(2));
  try {
    return new TextDecoder('utf-8', {
      fatal: !0,
    }).decode(i);
  } catch {}
  const l = i.subarray(0, Math.min(i.length, 96e3));
  let s = '';
  for (let h = 0; h < l.length; h += 8192) s += String.fromCharCode(...l.subarray(h, h + 8192));
  const o = charsetDetector.detect(s).encoding?.toLowerCase() ?? 'utf-8';
  const c = {
    gb2312: 'gb18030',
    gbk: 'gb18030',
    ascii: 'utf-8',
    'windows-1252': 'windows-1252',
    big5: 'big5',
    shift_jis: 'shift_jis',
  };
  try {
    return new TextDecoder(c[o] ?? o).decode(i);
  } catch {
    return new TextDecoder('utf-8').decode(i);
  }
};
const textParagraphs = (t) => {
  const i = t
    .replaceAll(
      `\r
`,
      `
`,
    )
    .replaceAll(
      '\r',
      `
`,
    ).split(`
`);
  const l = [];
  for (const s of i) {
    const o = s.trim();
    if (!o) continue;
    /^(第[零一二三四五六七八九十百千万两〇○\d]+[章节卷部篇回集幕]|chapter\s+[\divxlcdm]+|序章|序言|楔子|引子|尾声|终章|后记|前言|番外)/i.test(
      o,
    ) && o.length < 80
      ? l.push(`<h2>${escapeHtml(o)}</h2>`)
      : l.push(`<p>${escapeHtml(o)}</p>`);
  }
  return l.join(`
`);
};
const escapeHtml = (t) =>
  t
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const sanitizeHtml = (t) =>
  DOMPurify.sanitize(t, {
    USE_PROFILES: {
      html: !0,
    },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style'],
  });
const splitChapters = (t, i) => {
  const s = [
    ...new DOMParser().parseFromString(`<main>${t}</main>`, 'text/html').body.firstElementChild
      .children,
  ];
  const o = [];
  let c = {
    title: i,
    html: [],
    length: 0,
  };
  const h = () => {
    c.html.length && o.push(c);
  };
  for (const d of s) {
    const p = d.textContent?.length ?? 0;
    const m = /^H[1-3]$/.test(d.tagName);
    (m && c.html.length && c.length > 80) || c.length > 28e3
      ? (h(),
        (c = {
          title: m ? d.textContent?.trim() || i : `${i} ${o.length + 1}`,
          html: [],
          length: 0,
        }))
      : m && (c.title = d.textContent?.trim() || c.title);
    c.html.push(d.outerHTML);
    c.length += p;
  }
  h();
  return o.length
    ? o
    : [
        {
          title: i,
          html: [`<p>${escapeHtml(i)}</p>`],
          length: i.length,
        },
      ];
};
const wrapChapterHtml = (t, i) => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(t)}</title></head>
<body><article>${i}</article></body></html>`;
export {
  createTextBook,
  decodeBookText,
  textParagraphs,
  escapeHtml,
  sanitizeHtml,
  splitChapters,
  wrapChapterHtml,
};
