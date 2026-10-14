const flattenToc = (t = [], i = 0) =>
  t.flatMap((l) => [
    {
      label: String(l.label ?? l.title ?? '未命名章节'),
      href: l.href,
      depth: i,
    },
    ...flattenToc(l.subitems ?? l.children ?? [], i + 1),
  ]);
export { flattenToc };
