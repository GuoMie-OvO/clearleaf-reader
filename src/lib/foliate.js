const loadFoliate = () => (
  (viewModulePromise ??= import(foliateUrl('view.js'))), viewModulePromise
);
const loadOverlayer = () => (
  (overlayModulePromise ??= import(foliateUrl('overlayer.js'))), overlayModulePromise
);
const foliateUrl = (t) => new URL(`./foliate/${t}`, document.baseURI).href;
let viewModulePromise = null;
let overlayModulePromise = null;
export { loadFoliate, loadOverlayer, foliateUrl, viewModulePromise, overlayModulePromise };
