const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('clearleaf', {
  openBooks: () => ipcRenderer.invoke('dialog:open-books'),
  describeBooks: (paths) => ipcRenderer.invoke('books:describe', paths),
  getFilePath: (file) => webUtils.getPathForFile(file),
  getDroppedPaths: (files) =>
    Array.from(files ?? [], (file) => webUtils.getPathForFile(file)).filter(Boolean),
  renderPagePreview: (request) => ipcRenderer.invoke('books:page-preview', request),
  readBook: (path) => ipcRenderer.invoke('books:read', path),
  convertCbr: (path) => ipcRenderer.invoke('books:convert-cbr', path),
  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveLibrary: (value) => ipcRenderer.invoke('library:save', value),
  getLaunchFiles: () => ipcRenderer.invoke('app:get-launch-files'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    toggleFullscreen: () => ipcRenderer.send('window:toggle-fullscreen'),
    close: () => ipcRenderer.send('window:close'),
    setPosition: (position) => ipcRenderer.send('window:set-position', position),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximized: (callback) => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('window:maximized', listener);
      return () => ipcRenderer.removeListener('window:maximized', listener);
    },
  },
  onOpenRequested: (callback) => {
    const listener = (_event, paths) => callback(paths);
    ipcRenderer.on('books:open-requested', listener);
    return () => ipcRenderer.removeListener('books:open-requested', listener);
  },
});
