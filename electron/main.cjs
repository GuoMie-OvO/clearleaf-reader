const { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { zipSync } = require('fflate');
const { createExtractorFromData } = require('node-unrar-js');
const APP_SCHEME = 'clearleaf';
const SUPPORTED_EXTENSIONS = new Set([
  '.epub',
  '.txt',
  '.pdf',
  '.mobi',
  '.azw3',
  '.fb2',
  '.cbz',
  '.cbr',
  '.html',
  '.htm',
  '.md',
  '.markdown',
]);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif']);
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);
let mainWindow = null;
let queuedOpenFiles = [];
const appendDiagnostic = (event, detail) => {
  try {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      event,
      detail,
    });
    fs.appendFileSync(
      path.join(app.getPath('userData'), 'renderer-diagnostics.log'),
      `${line}\n`,
      'utf8',
    );
  } catch {}
};
const normalizeBookPath = (filePath) => {
  if (typeof filePath !== 'string') return null;
  const resolved = path.resolve(filePath);
  if (!SUPPORTED_EXTENSIONS.has(path.extname(resolved).toLowerCase())) return null;
  try {
    const stat = fs.statSync(resolved);
    return stat.isFile() ? resolved : null;
  } catch {
    return null;
  }
};
const filesFromArgv = (argv) => argv.map(normalizeBookPath).filter(Boolean);
const descriptorFor = (filePath) => {
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    extension: path.extname(filePath).slice(1).toLowerCase(),
    size: stat.size,
    modifiedAt: stat.mtimeMs,
  };
};
const getLibraryFile = () => path.join(app.getPath('userData'), 'library.json');
const readLibrary = () => {
  try {
    const raw = fs.readFileSync(getLibraryFile(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      version: 1,
      books: [],
      settings: {},
    };
  }
};
const writeLibrary = (value) => {
  const file = getLibraryFile();
  const temp = `${file}.next`;
  fs.mkdirSync(path.dirname(file), {
    recursive: true,
  });
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(temp, file);
  return true;
};
const registerAppProtocol = () => {
  protocol.handle(APP_SCHEME, (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== 'app')
        return new Response('Not found', {
          status: 404,
        });
      const root = path.resolve(__dirname, '..', 'dist');
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const target = path.resolve(root, `.${pathname}`);
      const relative = path.relative(root, target);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return new Response('Forbidden', {
          status: 403,
        });
      }
      return net.fetch(pathToFileURL(target).toString());
    } catch {
      return new Response('Not found', {
        status: 404,
      });
    }
  });
};
const showMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
};
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 320,
    minHeight: 420,
    show: false,
    frame: false,
    roundedCorners: true,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.once('ready-to-show', showMainWindow);
  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized', false));
  mainWindow.on('closed', () => {
    pagePreviewWindow?.close();
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return {
      action: 'deny',
    };
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    appendDiagnostic('render-process-gone', details);
    if (details.reason !== 'clean-exit') {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload();
      }, 180);
    }
  });
  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      appendDiagnostic('did-fail-load', {
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame,
      });
    },
  );
  const devServer = process.env.VITE_DEV_SERVER_URL;
  if (devServer) mainWindow.loadURL(devServer);
  else mainWindow.loadURL(`${APP_SCHEME}://app/index.html`);
  mainWindow.webContents.on('did-finish-load', () => {
    showMainWindow();
    if (queuedOpenFiles.length) {
      mainWindow.webContents.send('books:open-requested', queuedOpenFiles);
      queuedOpenFiles = [];
    }
  });
};
const sendOpenFiles = (paths) => {
  const files = paths.map(normalizeBookPath).filter(Boolean);
  if (!files.length) return;
  if (mainWindow?.webContents && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('books:open-requested', files);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    queuedOpenFiles.push(...files);
  }
};
ipcMain.handle('dialog:open-books', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入本地图书',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: '支持的图书',
        extensions: [...SUPPORTED_EXTENSIONS].map((x) => x.slice(1)),
      },
      {
        name: '所有文件',
        extensions: ['*'],
      },
    ],
  });
  if (result.canceled) return [];
  return result.filePaths.map(normalizeBookPath).filter(Boolean).map(descriptorFor);
});
ipcMain.handle('books:describe', (_event, paths) =>
  (Array.isArray(paths) ? paths : []).map(normalizeBookPath).filter(Boolean).map(descriptorFor),
);
ipcMain.handle('books:read', async (_event, requestedPath) => {
  const filePath = normalizeBookPath(requestedPath);
  if (!filePath) throw new Error('文件不存在或格式不受支持');
  const data = await fs.promises.readFile(filePath);
  return {
    ...descriptorFor(filePath),
    data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  };
});
ipcMain.handle('books:convert-cbr', async (_event, requestedPath) => {
  const filePath = normalizeBookPath(requestedPath);
  if (!filePath || path.extname(filePath).toLowerCase() !== '.cbr') {
    throw new Error('不是有效的 CBR 文件');
  }
  const source = await fs.promises.readFile(filePath);
  const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const extractor = await createExtractorFromData({
    data: buffer,
  });
  const extracted = extractor.extract({
    files: (header) =>
      !header.flags.directory && IMAGE_EXTENSIONS.has(path.extname(header.name).toLowerCase()),
  });
  const images = [...extracted.files]
    .filter((item) => item.extraction)
    .sort((a, b) =>
      a.fileHeader.name.localeCompare(b.fileHeader.name, undefined, {
        numeric: true,
      }),
    );
  if (!images.length) throw new Error('CBR 中没有可读取的图片');
  const archive = {};
  images.forEach((item, index) => {
    const ext = path.extname(item.fileHeader.name).toLowerCase() || '.jpg';
    archive[`${String(index + 1).padStart(5, '0')}${ext}`] = item.extraction;
  });
  const zipped = zipSync(archive, {
    level: 0,
  });
  return {
    name: `${path.basename(filePath, '.cbr')}.cbz`,
    data: zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength),
  };
});
let pagePreviewWindow = null;
let pagePreviewQueue = Promise.resolve();
const getPagePreviewWindow = async (width, height) => {
  if (!pagePreviewWindow || pagePreviewWindow.isDestroyed()) {
    pagePreviewWindow = new BrowserWindow({
      width,
      height,
      show: false,
      frame: false,
      focusable: false,
      skipTaskbar: true,
      backgroundColor: '#fff',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        backgroundThrottling: false,
      },
    });
    pagePreviewWindow.on('closed', () => {
      pagePreviewWindow = null;
    });
    await pagePreviewWindow.loadURL(APP_SCHEME + '://app/reader-preview.html');
  }
  const [currentWidth, currentHeight] = pagePreviewWindow.getContentSize();
  if (currentWidth !== width || currentHeight !== height)
    pagePreviewWindow.setContentSize(width, height);
  return pagePreviewWindow;
};
ipcMain.handle('books:page-preview', (event, request) => {
  if (event.sender !== mainWindow?.webContents)
    throw new Error('Preview is available to the reader only');
  const job = pagePreviewQueue.then(async () => {
    const bookPath = normalizeBookPath(request?.path);
    if (!bookPath || typeof request.cfi !== 'string') throw new Error('Invalid book preview');
    const width = Math.max(320, Math.min(4096, Math.round(Number(request.width) || 0)));
    const height = Math.max(320, Math.min(2160, Math.round(Number(request.height) || 0)));
    const preview = await getPagePreviewWindow(width, height);
    const value = {
      ...request,
      path: bookPath,
      width,
      height,
    };
    const metadata = await preview.webContents.executeJavaScript(
      'window.clearleafPreview.render(' + JSON.stringify(value) + ')',
    );
    const image = await preview.webContents.capturePage(undefined, {
      stayHidden: true,
    });
    const resized = image.resize({
      width: Math.min(width, 1600),
      height: Math.round(height * Math.min(1, 1600 / width)),
      quality: 'good',
    });
    return {
      dataUrl: resized.toDataURL(),
      ...metadata,
    };
  });
  pagePreviewQueue = job.catch(() => {});
  return job;
});
ipcMain.handle('library:load', () => readLibrary());
ipcMain.handle('library:save', (_event, value) => writeLibrary(value));
ipcMain.handle('app:get-launch-files', () => queuedOpenFiles.splice(0));
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.on('window:set-position', (_event, requested) => {
  if (!mainWindow || mainWindow.isDestroyed() || !requested) return;
  const nextX = Number(requested.x);
  const nextY = Number(requested.y);
  if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
  const [width, height] = mainWindow.getSize();
  const display = screen.getDisplayNearestPoint({
    x: Math.round(nextX + width / 2),
    y: Math.round(nextY + Math.min(height / 2, 120)),
  });
  const area = display.workArea;
  const x = Math.round(Math.max(area.x - width + 120, Math.min(area.x + area.width - 120, nextX)));
  const y = Math.round(Math.max(area.y, Math.min(area.y + area.height - 52, nextY)));
  mainWindow.setPosition(x, y);
});
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:toggle-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:toggle-fullscreen', () => {
  if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
ipcMain.on('window:close', () => mainWindow?.close());
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    showMainWindow();
    sendOpenFiles(filesFromArgv(argv));
  });
  app.whenReady().then(() => {
    registerAppProtocol();
    queuedOpenFiles.push(...filesFromArgv(process.argv.slice(1)));
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
