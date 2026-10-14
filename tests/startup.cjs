const { _electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

async function run() {
  const root = path.resolve(__dirname, '..');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'clearleaf-startup-'));
  const executablePath = process.env.CLEARLEAF_EXE || require('electron');
  const args = [...(process.env.CLEARLEAF_EXE ? [] : [root]), '--user-data-dir=' + profile];
  const env = { ...process.env, ELECTRON_RUN_AS_NODE: undefined };
  const app = await _electron.launch({ executablePath, args, env });
  const state = () => app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/index.html'));
    return { visible: win.isVisible(), minimized: win.isMinimized() };
  });
  async function reopen() {
    const child = spawnSync(executablePath, args, { env, windowsHide: true, timeout: 10000 });
    assert.equal(child.status, 0);
    for (let i = 0; i < 30; i++) {
      const current = await state();
      if (current.visible && !current.minimized) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.fail('Relaunch did not restore the main window');
  }
  try {
    const page = await app.firstWindow();
    await page.waitForFunction(() => Boolean(window.clearleaf));
    assert.equal((await state()).visible, true);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
    assert.equal((await state()).visible, false);
    await reopen();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].minimize());
    await reopen();
    console.log('PASS startup visibility, hidden-window relaunch, minimized-window relaunch');
  } finally {
    await app.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
