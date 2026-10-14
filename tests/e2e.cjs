const { _electron } = require('playwright');
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '..'),
  profile = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clearleaf-e2e-'));
const bookPath = path.join(__dirname, 'fixtures/turn.epub');
fs.writeFileSync(
  path.join(profile, 'library.json'),
  JSON.stringify({
    version: 1,
    books: [
      {
        id: 'test-book',
        path: bookPath,
        name: 'turn.epub',
        extension: 'epub',
        title: '翻页交互测试',
        author: 'Test',
        progress: 0,
        bookmarks: [],
        annotations: [],
      },
    ],
    settings: { mode: 'curl', columns: 1, autoHideUi: false },
  }),
);
const state = (page) =>
  page.evaluate(() => {
    const v = document.querySelector('foliate-view');
    return {
      cfi: v.lastLocation?.cfi,
      page: v.renderer.page,
      progress: v.lastLocation?.fraction,
      dataset: { ...document.querySelector('.reader-screen').dataset },
      overlay: document.querySelectorAll('.cl-page-turn-layer').length,
    };
  });
const idle = (page) =>
  page.waitForFunction(
    () => document.querySelector('.reader-screen')?.dataset.turnState === 'idle',
    null,
    { timeout: 10000 },
  );
const ready = (page) =>
  page.waitForFunction(
    () => document.querySelector('.reader-screen')?.dataset.previewReady === 'true',
    null,
    { timeout: 20000 },
  );
async function drag(page, start, end, steps = 12, hold = 0) {
  await page.mouse.move(...start);
  await page.mouse.down();
  if (hold) await page.waitForTimeout(hold);
  await page.mouse.move(...end, { steps });
  await page.waitForTimeout(130);
  await page.mouse.up();
  await idle(page);
}
(async () => {
  const app = await _electron.launch({
    executablePath: require('electron'),
    args: [root, '--user-data-dir=' + profile],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
  });
  const results = [],
    errors = [];
  try {
    const page = await app.firstWindow();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') console.log('CONSOLE', m.text());
    });
    await page.getByRole('button', { name: '打开《翻页交互测试》', exact: true }).click();
    await ready(page);
    let before = await state(page);
    await page.mouse.click(1250, 430);
    await idle(page);
    let after = await state(page);
    assert.equal(after.page, before.page + 1);
    results.push('Right tap advances exactly one page');
    await ready(page);
    before = after;
    await page.mouse.click(50, 430);
    await idle(page);
    after = await state(page);
    assert.equal(after.page, before.page - 1);
    results.push('Left tap moves back exactly one page');
    await ready(page);
    before = await state(page);
    await drag(page, [1000, 650], [560, 510]);
    after = await state(page);
    assert.equal(after.page, before.page + 1);
    results.push('Mouse horizontal drag advances one page');
    await ready(page);
    before = await state(page);
    await page.mouse.move(1100, 700);
    await page.mouse.down();
    await page.mouse.move(830, 570, { steps: 8 });
    await page.waitForTimeout(180);
    assert.equal(await page.locator('.cl-page-turn-layer').count(), 1);
    await page.mouse.move(1090, 700, { steps: 8 });
    await page.waitForTimeout(180);
    await page.mouse.up();
    await idle(page);
    after = await state(page);
    assert.equal(after.page, before.page);
    results.push('Reversing a drag returns the sheet and preserves location');
    await ready(page);
    before = await state(page);
    await drag(page, [380, 630], [840, 570]);
    after = await state(page);
    assert.equal(after.page, before.page - 1);
    results.push('Rightward drag turns to the previous page');
    await ready(page);
    before = await state(page);
    await drag(page, [800, 450], [770, 448], 3, 0);
    after = await state(page);
    assert.equal(after.page, before.page);
    results.push('Short drag settles back without an accidental click');
    const centerBefore = await state(page);
    const shown = await page.locator('.chrome-visible').count();
    await page.mouse.click(660, 430);
    await page.waitForTimeout(150);
    assert.equal((await state(page)).page, centerBefore.page);
    assert.notEqual(await page.locator('.chrome-visible').count(), shown);
    results.push('Center tap controls chrome without turning');
    await page.mouse.click(780, 20);
    await page.waitForTimeout(350);
    assert.equal((await state(page)).page, centerBefore.page);
    results.push('Top chrome guard does not turn the page');
    before = await state(page);
    await page.keyboard.down('Shift');
    await page.mouse.move(300, 420);
    await page.mouse.down();
    await page.mouse.move(620, 420, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    assert.equal((await state(page)).page, before.page);
    results.push('Modifier-assisted text selection does not turn');
    await page.evaluate(() =>
      document
        .querySelector('foliate-view')
        .renderer.getContents()
        .forEach((x) => x.doc.defaultView.getSelection().removeAllRanges()),
    );
    for (const [w, h, columns] of [
      [420, 780, 1],
      [320, 640, 1],
      [1600, 650, 1],
      [1320, 860, 2],
    ]) {
      await app.evaluate(
        ({ BrowserWindow }, size) =>
          (() => {
            const win = BrowserWindow.getAllWindows().find((x) =>
              x.webContents.getURL().includes('/index.html'),
            );
            if (win.isMaximized()) win.unmaximize();
            win.setSize(...size);
          })(),
        [w, h],
      );
      await page.waitForFunction(
        (size) => innerWidth === size[0] && innerHeight === size[1],
        [w, h],
      );
      await page.waitForTimeout(500);
      if (columns === 2) {
        if (!(await page.locator('.chrome-visible').count())) await page.mouse.click(w / 2, h / 2);
        await page.waitForTimeout(220);
        await page.getByRole('button', { name: '阅读设置' }).click();
        await page.getByRole('button', { name: '双栏', exact: true }).click();
        await page.getByRole('button', { name: '关闭面板', exact: true }).last().click();
        await page.waitForTimeout(500);
      }
      await ready(page);
      const b = await state(page);
      await page.mouse.click(w * 0.91, h * 0.55);
      await idle(page);
      const a = await state(page);
      assert.equal(a.page, b.page + 1, JSON.stringify({ w, h, b, a }));
      await ready(page);
      await page.mouse.click(w * 0.08, h * 0.55);
      await idle(page);
      const back = await state(page);
      assert.equal(back.page, a.page - 1);
      await ready(page);
      const dragBefore = await state(page);
      await drag(page, [w * 0.8, h * 0.72], [w * 0.36, h * 0.66]);
      assert.equal((await state(page)).page, dragBefore.page + 1);
      await ready(page);
      await drag(page, [w * 0.24, h * 0.7], [w * 0.7, h * 0.64]);
      assert.equal((await state(page)).page, dragBefore.page);
      results.push(
        `Adaptive tap and mouse drag regions work at ${w}×${h}, columns=${columns}, layout=${a.dataset.turnLayout}`,
      );
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ results, errors }, null, 2));
  } finally {
    await app.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
