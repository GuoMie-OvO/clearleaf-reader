const pdfjsPath = (path) => new URL(`vendor/pdfjs/${path}`, import.meta.url).toString();
import * as pdfjsLib from "./vendor/pdfjs/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsPath("pdf.worker.mjs");
const fetchText = async (url) => await (await fetch(url)).text();
const textLayerBuilderCSS = await fetchText(pdfjsPath("text_layer_builder.css"));
const annotationLayerBuilderCSS = await fetchText(pdfjsPath("annotation_layer_builder.css"));
const renderStates = /* @__PURE__ */ new WeakMap();
const render = async (page, doc, zoom) => {
  if (!doc?.documentElement) return;
  const safeZoom = Math.max(0.1, Math.min(8, Number(zoom) || 1));
  const previous = renderStates.get(doc) ?? {
    generation: 0,
    zoom: -1,
    task: null,
    promise: null,
    status: "idle"
  };
  const sameZoom = Math.abs(previous.zoom - safeZoom) < 2e-3;
  if (sameZoom && previous.status === "ready" && doc.querySelector("#canvas canvas")) return;
  if (sameZoom && previous.status === "rendering" && previous.promise)
    return previous.promise;
  previous.task?.cancel?.();
  const generation = previous.generation + 1;
  const state = {
    generation,
    zoom: safeZoom,
    task: null,
    promise: null,
    status: "rendering"
  };
  renderStates.set(doc, state);
  const promise = (async () => {
    const viewport = page.getViewport({ scale: safeZoom });
    const requestedOutputScale = Math.max(1, Math.min(3, devicePixelRatio || 1));
    const pagePixels = Math.max(1, viewport.width * viewport.height);
    const maxByPixels = Math.sqrt(16e6 / pagePixels);
    const maxByDimension = 8192 / Math.max(1, viewport.width, viewport.height);
    const outputScale = Math.max(0.35, Math.min(requestedOutputScale, maxByPixels, maxByDimension));
    const renderViewport = page.getViewport({ scale: safeZoom * outputScale });
    doc.documentElement.style.removeProperty("transform");
    doc.documentElement.style.setProperty("--scale-factor", safeZoom);
    Object.assign(doc.documentElement.style, {
      width: `${viewport.width}px`,
      height: `${viewport.height}px`,
      overflow: "hidden"
    });
    Object.assign(doc.body.style, {
      width: `${viewport.width}px`,
      height: `${viewport.height}px`,
      overflow: "hidden",
      position: "relative"
    });
    const canvas = document.createElement("canvas");
    canvas.height = Math.ceil(renderViewport.height);
    canvas.width = Math.ceil(renderViewport.width);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.style.display = "block";
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) throw new Error("\u65E0\u6CD5\u521B\u5EFA PDF \u753B\u5E03");
    const renderTask = page.render({ canvasContext, viewport: renderViewport });
    state.task = renderTask;
    await renderTask.promise;
    if (renderStates.get(doc)?.generation !== generation || !doc.documentElement.isConnected) return;
    const canvasHost = doc.querySelector("#canvas");
    if (!canvasHost) throw new Error("PDF \u9875\u9762\u5BB9\u5668\u4E0D\u5B58\u5728");
    canvasHost.replaceChildren(doc.adoptNode(canvas));
    doc.querySelector(".pdf-render-error")?.remove();
    try {
      const container = doc.querySelector(".textLayer");
      if (container) {
        container.replaceChildren();
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: await page.streamTextContent(),
          container,
          viewport
        });
        await textLayer.render();
        if (renderStates.get(doc)?.generation !== generation) return;
        for (const hiddenCanvas of doc.querySelectorAll(".hiddenCanvasElement"))
          Object.assign(hiddenCanvas.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "0",
            height: "0",
            display: "none"
          });
        const endOfContent = doc.createElement("div");
        endOfContent.className = "endOfContent";
        container.append(endOfContent);
        container.onpointerdown = () => container.classList.add("selecting");
        container.onpointerup = () => container.classList.remove("selecting");
      }
    } catch (error) {
      console.warn("PDF text layer failed; keeping the rendered page", error);
      doc.querySelector(".textLayer")?.replaceChildren();
    }
    try {
      const div = doc.querySelector(".annotationLayer");
      if (div) {
        div.replaceChildren();
        const linkService = {
          goToDestination: () => {
          },
          getDestinationHash: (dest) => JSON.stringify(dest),
          addLinkAttributes: (link, url) => link.href = url
        };
        await new pdfjsLib.AnnotationLayer({ page, viewport, div, linkService }).render({ annotations: await page.getAnnotations() });
      }
    } catch (error) {
      console.warn("PDF annotation layer failed; keeping the rendered page", error);
      doc.querySelector(".annotationLayer")?.replaceChildren();
    }
    if (renderStates.get(doc)?.generation !== generation) return;
    state.task = null;
    state.status = "ready";
    doc.dispatchEvent(new CustomEvent("pdf-render-complete"));
  })().catch((error) => {
    if (error?.name === "RenderingCancelledException") {
      if (renderStates.get(doc)?.generation === generation) {
        state.task = null;
        state.promise = null;
        state.status = "idle";
        state.zoom = Number.NaN;
      }
      return;
    }
    if (renderStates.get(doc)?.generation !== generation) return;
    state.task = null;
    state.promise = null;
    state.status = "error";
    state.zoom = Number.NaN;
    const message = String(error?.message ?? error ?? "\u672A\u77E5\u9519\u8BEF");
    console.error("PDF page render failed", error);
    let failure = doc.querySelector(".pdf-render-error");
    if (!failure) {
      failure = doc.createElement("div");
      failure.className = "pdf-render-error";
      Object.assign(failure.style, {
        position: "absolute",
        inset: "0",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        boxSizing: "border-box",
        color: "#6b1f1f",
        background: "#fff7f7",
        textAlign: "center",
        font: "14px/1.6 system-ui, sans-serif"
      });
      doc.body.append(failure);
    }
    failure.textContent = `PDF \u9875\u9762\u6E32\u67D3\u5931\u8D25\uFF1A${message}`;
    doc.dispatchEvent(new CustomEvent("pdf-render-error", {
      detail: { message }
    }));
  });
  state.promise = promise;
  return promise;
};
const renderPage = async (page, getImageBlob) => {
  const naturalViewport = page.getViewport({ scale: 1 });
  const thumbnailScale = getImageBlob ? Math.min(1, 1400 / Math.max(naturalViewport.width, naturalViewport.height)) : 1;
  const viewport = page.getViewport({ scale: thumbnailScale });
  if (getImageBlob) {
    const canvas = document.createElement("canvas");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const canvasContext = canvas.getContext("2d");
    await page.render({ canvasContext, viewport }).promise;
    return new Promise((resolve) => canvas.toBlob(resolve));
  }
  const src = URL.createObjectURL(new Blob([`
        <!DOCTYPE html>
        <html lang="en">
        <meta charset="utf-8">
        <meta name="viewport" content="width=${viewport.width}, height=${viewport.height}">
        <style>
        html, body {
            margin: 0;
            padding: 0;
        }
        /*
        https://github.com/mozilla/pdf.js/commit/bd05b255fabfc313b194bfe9a17ccded4d90fb5a
        */
        :root {
          --user-unit: 1;
          --total-scale-factor: calc(var(--scale-factor) * var(--user-unit));
          --scale-round-x: 1px;
          --scale-round-y: 1px;
        }
        ${textLayerBuilderCSS}
        ${annotationLayerBuilderCSS}
        </style>
        <div id="canvas"></div>
        <div class="textLayer"></div>
        <div class="annotationLayer"></div>
    `], { type: "text/html" }));
  const onZoom = ({ doc, scale }) => render(page, doc, scale);
  return { src, onZoom };
};
const makeTOCItem = (item) => ({
  label: item.title,
  href: JSON.stringify(item.dest),
  subitems: item.items.length ? item.items.map(makeTOCItem) : null
});
export const makePDF = async (file) => {
  const sourceData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({
    data: sourceData,
    cMapUrl: pdfjsPath("cmaps/"),
    standardFontDataUrl: pdfjsPath("standard_fonts/"),
    isEvalSupported: false,
    useWorkerFetch: false
  }).promise;
  const book = { rendition: { layout: "pre-paginated", spread: "none" } };
  const { metadata, info } = await pdf.getMetadata() ?? {};
  book.metadata = {
    title: metadata?.get("dc:title") ?? info?.Title,
    author: metadata?.get("dc:creator") ?? info?.Author,
    contributor: metadata?.get("dc:contributor"),
    description: metadata?.get("dc:description") ?? info?.Subject,
    language: metadata?.get("dc:language"),
    publisher: metadata?.get("dc:publisher"),
    subject: metadata?.get("dc:subject"),
    identifier: metadata?.get("dc:identifier"),
    source: metadata?.get("dc:source"),
    rights: metadata?.get("dc:rights")
  };
  const outline = await pdf.getOutline();
  book.toc = outline?.map(makeTOCItem);
  const cache = /* @__PURE__ */ new Map();
  book.sections = Array.from({ length: pdf.numPages }).map((_, i) => ({
    id: i,
    load: async () => {
      const cached = cache.get(i);
      if (cached) return cached;
      const url = await renderPage(await pdf.getPage(i + 1));
      cache.set(i, url);
      return url;
    },
    size: 1e3
  }));
  book.isExternal = (uri) => /^\w+:/i.test(uri);
  book.resolveHref = async (href) => {
    const parsed = JSON.parse(href);
    const dest = typeof parsed === "string" ? await pdf.getDestination(parsed) : parsed;
    const index = await pdf.getPageIndex(dest[0]);
    return { index };
  };
  book.splitTOCHref = async (href) => {
    const parsed = JSON.parse(href);
    const dest = typeof parsed === "string" ? await pdf.getDestination(parsed) : parsed;
    const index = await pdf.getPageIndex(dest[0]);
    return [index, null];
  };
  book.getTOCFragment = (doc) => doc.documentElement;
  book.getCover = async () => renderPage(await pdf.getPage(1), true);
  book.destroy = () => {
    for (const value of cache.values()) {
      const src = typeof value === "string" ? value : value?.src;
      if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    }
    cache.clear();
    return pdf.destroy();
  };
  return book;
};
