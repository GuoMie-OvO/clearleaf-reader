const readerThemes = {
  paper: {
    background: '#ffffff',
    text: '#171717',
    muted: '#666666',
    link: '#2563eb',
  },
  sepia: {
    background: '#f4ecd8',
    text: '#3c3227',
    muted: '#7d6e5c',
    link: '#8a5a2b',
  },
  sage: {
    background: '#e8f0e4',
    text: '#253128',
    muted: '#667363',
    link: '#356146',
  },
  night: {
    background: '#151515',
    text: '#f0ede7',
    muted: '#aaa59d',
    link: '#78a9df',
  },
};
const getFontStack = (t) =>
  ({
    serif: 'ui-serif, "Songti SC", "SimSun", Georgia, serif',
    sans: 'system-ui, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif',
    song: '"Songti SC", "STSong", "SimSun", serif',
    kai: '"KaiTi", "STKaiti", serif',
    georgia: 'Georgia, "Times New Roman", serif',
  })[t] ?? 'ui-serif, serif';
const buildReaderStyles = (t) => {
  const i = readerThemes[t.theme];
  return `
    @namespace epub "http://www.idpf.org/2007/ops";
    :root { color-scheme: ${t.theme === 'night' ? 'dark' : 'light'}; background: ${i.background}; color: ${i.text}; }
    html, body { background: ${i.background} !important; color: ${i.text} !important; }
    body {
      font-family: ${getFontStack(t.fontFamily)} !important;
      font-size: ${t.fontSize}px !important;
      font-weight: ${t.fontWeight};
      line-height: ${t.lineHeight};
      letter-spacing: ${t.letterSpacing}em;
      hanging-punctuation: allow-end last;
      text-rendering: optimizeLegibility;
      font-optical-sizing: auto;
    }
    p, li, blockquote, dd {
      line-height: ${t.lineHeight} !important;
      text-align: ${t.textAlign} !important;
      margin-block-start: 0 !important;
      margin-block-end: ${t.paragraphSpacing}em !important;
      orphans: 2; widows: 2;
    }
    h1, h2, h3, h4 { font-family: ${getFontStack(t.fontFamily)}; letter-spacing: -0.025em; line-height: 1.18; }
    a:link { color: ${i.link}; }
    ::selection { background: rgba(110, 142, 255, .28); }
    pre { white-space: pre-wrap !important; }
    img, svg { max-width: 100%; height: auto; }
    aside[epub|type~="endnote"], aside[epub|type~="footnote"], aside[epub|type~="note"] { display: none; }
  `;
};
export { readerThemes, getFontStack, buildReaderStyles };
