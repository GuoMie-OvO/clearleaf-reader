import React from 'react';
export function useReaderSearch({ viewRef }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchProgress, setSearchProgress] = React.useState(0);
  const [searchResults, setSearchResults] = React.useState([]);
  const searchBook = async (D) => {
    D?.preventDefault();
    const P = searchQuery.trim();
    const n0 = viewRef.current;
    if (!P || !n0) return;
    setSearching(true);
    setSearchResults([]);
    setSearchProgress(0);
    const C0 = [];
    try {
      for await (const S0 of n0.search({
        query: P,
        matchCase: false,
        matchDiacritics: false,
        matchWholeWords: false,
      }))
        if (typeof S0 != 'string') {
          if ((typeof S0.progress == 'number' && setSearchProgress(S0.progress), S0.subitems)) {
            for (const p1 of S0.subitems)
              if (
                (C0.push({
                  cfi: p1.cfi,
                  label: S0.label || '正文',
                  excerpt: p1.excerpt,
                }),
                C0.length >= 250)
              )
                break;
            setSearchResults([...C0]);
          }
          if (C0.length >= 250) break;
        }
    } catch (S0) {
      console.warn('Search failed', S0);
    } finally {
      setSearching(false);
      setSearchProgress(1);
    }
  };
  return {
    searchQuery,
    setSearchQuery,
    searching,
    searchProgress,
    searchResults,
    searchBook,
  };
}
