import test from 'node:test';
import assert from 'node:assert/strict';
import { titleFromFilename, getMimeType } from '../../src/books/files.js';
import { flattenToc } from '../../src/lib/toc.js';
test('book names preserve dots and Unicode', () => {
  assert.equal(titleFromFilename('测试.第二卷.EPUB'), '测试.第二卷');
  assert.equal(titleFromFilename('notes.unknown'), 'notes.unknown');
  assert.equal(getMimeType('epub'), 'application/epub+zip');
  assert.equal(getMimeType('unknown'), 'application/octet-stream');
});
test('nested chapter entries preserve order and depth', () => {
  assert.deepEqual(
    flattenToc([{ title: '卷一', href: 'a', children: [{ label: '第一章', href: 'b' }] }]),
    [
      { label: '卷一', href: 'a', depth: 0 },
      { label: '第一章', href: 'b', depth: 1 },
    ],
  );
});
