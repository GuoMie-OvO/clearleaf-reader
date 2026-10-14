import { PageFlip } from '../../vendor/page-flip/PageFlip.js';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const frames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const ignored =
  'a,button,input,textarea,select,[contenteditable],video,audio,.reader-titlebar,.reader-footer,.reader-sheet,.reader-scrim,.selection-toolbar';
async function image(url) {
  const result = new Image();
  result.src = url;
  await result.decode();
  return result;
}
async function crops(url, rect, width, height, columns) {
  const bitmap = await image(url),
    scale = bitmap.width / width,
    result = [];
  for (let i = 0; i < columns; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.width / columns);
    canvas.height = Math.round(rect.height);
    canvas
      .getContext('2d')
      .drawImage(
        bitmap,
        (rect.left + (i * rect.width) / columns) * scale,
        rect.top * scale,
        (rect.width / columns) * scale,
        rect.height * scale,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    result.push(canvas.toDataURL());
  }
  return result;
}
export function createPageTurnController(options) {
  const root = options.root,
    view = options.view,
    documents = new Map();
  let alive = true,
    busy = false,
    gesture = null,
    engine = null,
    cache = null,
    loading = null,
    warmTimer = 0,
    settleTimer = 0,
    swallowUntil = 0,
    wheelTime = 0,
    pendingSteps = 0,
    pendingInstant = false,
    lastDirection = 'next',
    memoScope = '',
    primePromise = null;
  const pageMemo = new Map(),
    pageLinks = new Map(),
    previewRequests = new Map();
  const reduced = () =>
    options.getSettings().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const geometry = () => {
    const width = root.clientWidth,
      height = root.clientHeight,
      portrait = height > width * 1.12,
      wide = width / height > 1.55;
    const top = clamp(Math.round(height * 0.06), 52, 68),
      bottom = clamp(Math.round(height * 0.075), 48, 72);
    const band = portrait ? 0.28 : wide ? 0.2 : 0.24;
    const columns =
      Number(view.renderer?.getAttribute('max-column-count')) === 2 && width >= 980 ? 2 : 1;
    const rect = {
      left: 0,
      top: 0,
      width,
      height,
    };
    const hitArea = {
      left: 0,
      top,
      width,
      height: Math.max(120, height - top - bottom),
    };
    root.dataset.turnLayout =
      columns === 2 ? 'spread' : portrait ? 'portrait' : wide ? 'landscape' : 'balanced';
    root.dataset.turnEdge = String(band);
    root.dataset.turnTop = String(top);
    root.dataset.turnBottom = String(height - bottom);
    return {
      width,
      height,
      rect,
      hitArea,
      band,
      columns,
    };
  };
  const request = () => {
    const g = geometry(),
      settings = options.getSettings(),
      attributes = {};
    for (const key of [
      'flow',
      'margin',
      'gap',
      'max-inline-size',
      'max-block-size',
      'max-column-count',
    ]) {
      const value = view.renderer?.getAttribute(key);
      if (value != null) attributes[key] = value;
    }
    return {
      ...g,
      path: options.path,
      cfi: options.getLocation(),
      theme: settings.theme,
      brightness: settings.brightness,
      styles: options.getStyles(),
      attributes,
    };
  };
  const pageId = () => `${view.renderer.getContents()[0]?.index ?? 0}:${view.renderer.page}`;
  const scopeOf = (data) => {
    const { cfi, ...layout } = data;
    return JSON.stringify(layout);
  };
  const signature = () => JSON.stringify([scopeOf(request()), pageId()]);
  function useScope(data) {
    const scope = scopeOf(data);
    if (scope !== memoScope) {
      memoScope = scope;
      pageMemo.clear();
      pageLinks.clear();
      cache = null;
    }
    return scope;
  }
  function remember(node) {
    pageMemo.delete(node.id);
    pageMemo.set(node.id, node);
    while (pageMemo.size > 9) {
      const id = pageMemo.keys().next().value;
      pageMemo.delete(id);
      pageLinks.delete(id);
    }
    return node;
  }
  async function fetchPage(data, direction, sourceId) {
    const scope = scopeOf(data),
      knownId = direction === 'current' ? sourceId : pageLinks.get(sourceId)?.[direction];
    if (scope === memoScope && knownId && pageMemo.has(knownId))
      return remember(pageMemo.get(knownId));
    const key = JSON.stringify([scope, sourceId, direction]);
    if (previewRequests.has(key)) return previewRequests.get(key);
    const promise = (async () => {
      const result = await window.clearleaf.renderPagePreview({
        ...data,
        direction,
      });
      if (!alive || scope !== memoScope) return null;
      const parts = await crops(result.dataUrl, data.rect, data.width, data.height, data.columns);
      if (!alive || scope !== memoScope) return null;
      const node = remember({
        id: `${result.index}:${result.page}`,
        cfi: result.location,
        parts,
      });
      if (direction !== 'current') {
        pageLinks.set(sourceId, {
          ...pageLinks.get(sourceId),
          [direction]: node.id,
        });
        if (node.id !== sourceId)
          pageLinks.set(node.id, {
            ...pageLinks.get(node.id),
            [direction === 'next' ? 'prev' : 'next']: sourceId,
          });
      }
      return node;
    })().finally(() => previewRequests.delete(key));
    previewRequests.set(key, promise);
    return promise;
  }
  function prime(data, node, direction) {
    if (!node || primePromise || !alive) return;
    const destination = pageLinks.get(node.id)?.[direction];
    if (destination && pageMemo.has(destination)) return;
    primePromise = fetchPage(
      {
        ...data,
        cfi: node.cfi,
      },
      direction,
      node.id,
    )
      .catch((error) => {
        if (alive) console.warn('Page prefetch unavailable', error);
      })
      .finally(() => {
        primePromise = null;
      });
  }
  function snapshot(data, id, key) {
    const current = pageMemo.get(id),
      links = pageLinks.get(id),
      prev = pageMemo.get(links?.prev),
      next = pageMemo.get(links?.next);
    if (!current || !prev || !next) return null;
    return {
      ...data,
      key,
      images: [...prev.parts, ...current.parts, ...next.parts],
      current,
      prev,
      next,
    };
  }
  const status = (value) => {
    if (alive) root.dataset.turnState = value;
  };
  const destroyEngine = () => {
    clearTimeout(settleTimer);
    if (engine) {
      engine.flip.destroy();
      engine = null;
    }
    root.classList.remove('cl-page-turning');
  };
  async function warm(force = false) {
    if (
      !alive ||
      (!force && (busy || gesture)) ||
      options.getSettings().mode !== 'curl' ||
      reduced()
    )
      return null;
    const data = request();
    if (!data.cfi) return null;
    useScope(data);
    const id = pageId(),
      key = signature();
    const existing = snapshot(data, id, key);
    if (existing) {
      cache = existing;
      root.dataset.previewReady = 'true';
      prime(data, lastDirection === 'next' ? existing.next : existing.prev, lastDirection);
      return existing;
    }
    if (loading) {
      if (loading.key === key) return loading.promise;
      await loading.promise;
      return alive ? warm(force) : null;
    }
    const promise = (async () => {
      const current = await fetchPage(data, 'current', id);
      if (!current) return null;
      await Promise.all([fetchPage(data, 'next', id), fetchPage(data, 'prev', id)]);
      if (!alive || signature() !== key) return null;
      cache = snapshot(data, id, key);
      if (cache) {
        root.dataset.previewReady = 'true';
        prime(data, lastDirection === 'next' ? cache.next : cache.prev, lastDirection);
      }
      return cache;
    })()
      .catch((error) => {
        if (alive) console.warn('Page preview unavailable', error);
        return null;
      })
      .finally(() => {
        if (loading?.promise === promise) loading = null;
      });
    loading = {
      key,
      promise,
    };
    return promise;
  }
  const schedule = () => {
    clearTimeout(warmTimer);
    warmTimer = setTimeout(() => {
      warm();
    }, 16);
  };
  const canTurn = (direction) =>
    direction === 'next' ? !view.renderer?.atEnd : !view.renderer?.atStart;
  function queueCount() {
    if (alive) root.dataset.queuedTurns = String(Math.abs(pendingSteps));
  }
  function clearQueue() {
    pendingSteps = 0;
    pendingInstant = false;
    queueCount();
  }
  function enqueue(direction, instant) {
    pendingSteps += direction === 'next' ? 1 : -1;
    pendingInstant ||= instant;
    queueCount();
    if (engine?.started && !engine.completing && root.dataset.turnState === 'animating')
      engine.flip.getRender().accelerateAnimation(Math.abs(pendingSteps) > 1 ? 40 : 80);
  }
  function drain() {
    if (!alive || busy || gesture || !pendingSteps || options.isBlocked()) return;
    const direction = pendingSteps > 0 ? 'next' : 'prev';
    if (!canTurn(direction)) {
      clearQueue();
      status('idle');
      schedule();
      return;
    }
    pendingSteps += direction === 'next' ? -1 : 1;
    const instant = pendingInstant;
    if (!pendingSteps) pendingInstant = false;
    queueCount();
    turn(direction, {
      instant,
      queued: true,
    });
  }
  function release() {
    busy = false;
    cache = null;
    root.dataset.previewReady = 'false';
    if (pendingSteps) {
      status('queued');
      drain();
    } else {
      status('idle');
      schedule();
    }
  }
  async function complete(direction, commit, token) {
    if (!alive || engine !== token || token.completing) return;
    token.completing = true;
    clearTimeout(settleTimer);
    try {
      if (commit && canTurn(direction) && !options.isBlocked()) {
        status('committing');
        await options.navigate(direction);
        if (!alive || engine !== token) return;
        for (const { doc } of view.renderer.getContents()) await doc?.fonts?.ready;
        await frames();
      }
    } catch (error) {
      if (alive) console.warn('Page navigation failed', error);
      clearQueue();
    } finally {
      if (alive && engine === token) {
        destroyEngine();
        release();
      }
    }
  }
  async function build(direction, source, heldSnapshot = null, fast = false) {
    if (!canTurn(direction)) return null;
    const data = request();
    useScope(data);
    const key = signature();
    let snapshots =
      heldSnapshot || snapshot(data, pageId(), key) || (cache?.key === key ? cache : null);
    if (!snapshots) {
      const pending = loading?.key === key ? loading.promise : warm(true);
      if (pending)
        snapshots = await Promise.race([
          pending,
          new Promise((resolve) => setTimeout(() => resolve(null), 1200)),
        ]);
    }
    if (
      !alive ||
      !snapshots ||
      (!heldSnapshot && signature() !== key) ||
      snapshots.width !== root.clientWidth ||
      snapshots.height !== root.clientHeight
    )
      return null;
    destroyEngine();
    const block = document.createElement('div');
    block.className = 'cl-page-turn-layer';
    block.setAttribute('aria-hidden', 'true');
    Object.assign(block.style, {
      left: `${snapshots.rect.left}px`,
      top: `${snapshots.rect.top}px`,
      width: `${snapshots.rect.width}px`,
      height: `${snapshots.rect.height}px`,
    });
    root.querySelector('.reader-stage').append(block);
    const flip = new PageFlip(block, {
      width: snapshots.rect.width / snapshots.columns,
      height: snapshots.rect.height,
      size: 'fixed',
      startPage: snapshots.columns,
      usePortrait: snapshots.columns === 1,
      showCover: false,
      drawShadow: true,
      maxShadowOpacity: 0.32,
      flippingTime: source === 'tap' ? (fast ? 140 : 220) : 280,
      useMouseEvents: false,
      showPageCorners: false,
      autoSize: false,
      mobileScrollSupport: false,
      disableFlipByClick: false,
    });
    block.style.visibility = 'hidden';
    const token = {
      flip,
      block,
      direction,
      commit: false,
      source,
      rect: snapshots.rect,
      columns: snapshots.columns,
      started: false,
    };
    engine = token;
    flip.on('flip', (event) => {
      if (token.started && event.data !== snapshots.columns) token.commit = true;
    });
    flip.on('changeState', (event) => {
      root.dataset.foldState = event.data;
      if (event.data === 'read' && token.started) complete(direction, token.commit, token);
    });
    prime(data, direction === 'next' ? snapshots.next : snapshots.prev, direction);
    flip.loadFromImages(snapshots.images);
    await flip.ready();
    await new Promise(requestAnimationFrame);
    if (!alive || engine !== token) return null;
    block.style.visibility = 'visible';
    root.classList.add('cl-page-turning');
    return token;
  }
  async function turn(direction, { instant = false, queued = false } = {}) {
    if (!alive || options.isBlocked()) return;
    if (busy || (!queued && pendingSteps)) {
      enqueue(direction, instant);
      drain();
      return;
    }
    if (gesture || !canTurn(direction)) return;
    lastDirection = direction;
    if (instant || options.getSettings().mode !== 'curl' || reduced()) {
      busy = true;
      status('committing');
      try {
        await options.navigate(direction);
      } finally {
        if (alive) release();
      }
      return;
    }
    busy = true;
    status('preparing');
    try {
      const token = await build(direction, 'tap', null, queued);
      if (!token) {
        if (alive) await options.navigate(direction);
        if (alive) release();
        return;
      }
      status('animating');
      token.started = true;
      direction === 'next' ? token.flip.flipNext('bottom') : token.flip.flipPrev('bottom');
      if (pendingSteps)
        token.flip.getRender().accelerateAnimation(Math.abs(pendingSteps) > 1 ? 40 : 80);
      settleTimer = setTimeout(() => complete(direction, token.commit, token), 700);
    } catch (error) {
      destroyEngine();
      if (alive) {
        clearQueue();
        release();
        console.warn('Page turn failed', error);
      }
    }
  }
  const point = (event, doc) => {
    const frame = doc?.defaultView?.frameElement?.getBoundingClientRect();
    const bounds = root.getBoundingClientRect();
    return {
      x: event.clientX + (frame?.left || 0) - bounds.left,
      y: event.clientY + (frame?.top || 0) - bounds.top,
    };
  };
  const inArea = (p) => {
    const g = geometry();
    return (
      p.x >= 0 && p.x <= g.width && p.y >= g.hitArea.top && p.y <= g.hitArea.top + g.hitArea.height
    );
  };
  const tap = (p) => {
    const g = geometry();
    if (p.x < g.width * g.band) turn('prev');
    else if (p.x > g.width * (1 - g.band)) turn('next');
    else options.centerTap();
  };
  function down(event, doc) {
    if (
      !alive ||
      gesture ||
      options.isBlocked() ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      event.target.closest?.(ignored)
    )
      return;
    const start = point(event, doc);
    if (!inArea(start)) return;
    if (!cache) warm();
    gesture = {
      snapshot: !busy && cache?.key === signature() ? cache : null,
      id: event.pointerId,
      start,
      last: start,
      at: performance.now(),
      lastAt: performance.now(),
      velocity: 0,
      phase: 'pending',
      doc,
      target: event.target,
      direction: null,
      token: null,
      ended: false,
    };
  }
  function follow(g, p) {
    if (!g.token) return;
    const width = g.token.rect.width,
      height = g.token.rect.height;
    const dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    const bottom = g.start.y - g.token.rect.top >= height / 2,
      baseY = bottom ? height - 16 : 16;
    const local = {
      x: g.direction === 'next' ? width + dx : dx,
      y: clamp(
        baseY + dy * 0.6 + (bottom ? -1 : 1) * Math.min(height * 0.12, Math.abs(dx) * 0.12),
        1,
        height - 1,
      ),
    };
    g.token.flip.userMove(local, true);
    g.token.block.dataset.dragDistance = String(Math.round(dx));
  }
  function move(event, doc) {
    const g = gesture;
    if (!g || g.id !== event.pointerId) return;
    const p = point(event, doc),
      dx = p.x - g.start.x,
      dy = p.y - g.start.y,
      now = performance.now();
    g.velocity = (p.x - g.last.x) / Math.max(1, now - g.lastAt);
    g.last = p;
    g.lastAt = now;
    if (g.phase === 'pending') {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.25) {
        g.phase = 'selection';
        return;
      }
      if (now - g.at > 400 && Math.abs(dx) < 14) {
        g.phase = 'selection';
        return;
      }
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      if (options.getSettings().mode === 'scroll') {
        g.phase = 'selection';
        return;
      }
      if (busy) {
        g.phase = 'queued-drag';
        g.direction = dx < 0 ? 'next' : 'prev';
        event.preventDefault();
        return;
      }
      if (g.snapshot?.key !== signature()) g.snapshot = null;
      g.phase = 'drag';
      g.direction = dx < 0 ? 'next' : 'prev';
      lastDirection = g.direction;
      try {
        g.target.setPointerCapture?.(g.id);
      } catch {}
      g.doc?.defaultView?.getSelection()?.removeAllRanges();
      event.preventDefault();
      status('dragging');
      if (options.getSettings().mode === 'curl' && !reduced())
        build(g.direction, 'drag', g.snapshot).then((token) => {
          if (!alive || gesture !== g || g.ended) {
            if (engine === token) destroyEngine();
            return;
          }
          g.token = token;
          if (token) {
            token.started = true;
            token.flip.startUserTouch({
              x: g.direction === 'next' ? token.rect.width - 1 : 1,
              y: g.start.y - token.rect.top,
            });
            follow(g, g.last);
          } else root.dataset.foldState = 'direct';
        });
    }
    if (g.phase === 'queued-drag') {
      event.preventDefault();
      return;
    }
    if (g.phase === 'drag') {
      event.preventDefault();
      g.doc?.defaultView?.getSelection()?.removeAllRanges();
      follow(g, p);
    }
  }
  function finish(event, doc, cancel = false) {
    const g = gesture;
    if (!g || g.id !== event.pointerId) return;
    const p = point(event, doc);
    g.ended = true;
    gesture = null;
    try {
      g.target.releasePointerCapture?.(g.id);
    } catch {}
    if (g.phase === 'selection') {
      drain();
      return;
    }
    if (cancel) {
      swallowUntil = performance.now() + 450;
      if (!g.token && busy) {
        drain();
        return;
      }
      if (g.token) {
        busy = true;
        g.token.flip.getFlipController().finishGesture(false);
        settleTimer = setTimeout(() => complete(g.direction, false, g.token), 600);
      } else {
        destroyEngine();
        status('idle');
      }
      return;
    }
    if (g.phase === 'pending') {
      if (performance.now() - g.at > 450 && g.doc?.defaultView?.getSelection()?.toString()) {
        schedule();
        drain();
        return;
      }
      if (Math.hypot(p.x - g.start.x, p.y - g.start.y) < 10 && inArea(p)) {
        swallowUntil = performance.now() + 450;
        tap(p);
      }
      drain();
      return;
    }
    event.preventDefault();
    swallowUntil = performance.now() + 500;
    const dx = p.x - g.start.x,
      width = geometry().rect.width / geometry().columns;
    const signed = g.direction === 'next' ? -dx : dx;
    const velocity =
      performance.now() - g.lastAt < 100 ? (g.direction === 'next' ? -g.velocity : g.velocity) : 0;
    const commit = signed > Math.min(140, width * 0.22) || (signed > 24 && velocity > 0.35);
    if (g.phase === 'queued-drag') {
      if (commit) turn(g.direction);
      else drain();
      return;
    }
    if (g.token) {
      busy = true;
      g.token.flip.getFlipController().finishGesture(commit);
      settleTimer = setTimeout(() => complete(g.direction, commit && g.token.commit, g.token), 600);
    } else {
      destroyEngine();
      status('idle');
      if (commit) {
        turn(g.direction, {
          instant: g.phase !== 'queued-drag',
        });
      } else {
        drain();
        schedule();
      }
    }
  }
  function click(event) {
    if (performance.now() < swallowUntil && !event.target.closest?.(ignored)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  function wheel(event) {
    if (
      options.isBlocked() ||
      event.ctrlKey ||
      event.target.closest?.(ignored) ||
      Math.abs(event.deltaY) < 24
    )
      return;
    const now = performance.now();
    if (options.getSettings().mode === 'scroll') return;
    if (now - wheelTime < 360) {
      event.preventDefault();
      return;
    }
    wheelTime = now;
    event.preventDefault();
    turn(event.deltaY > 0 ? 'next' : 'prev');
  }
  function attach(doc) {
    if (documents.has(doc)) return;
    const handlers = {
      pointerdown: (e) => down(e, doc === document ? null : doc),
      pointermove: (e) => move(e, doc === document ? null : doc),
      pointerup: (e) => finish(e, doc === document ? null : doc),
      pointercancel: (e) => finish(e, doc === document ? null : doc, true),
      click,
      wheel,
    };
    const target = doc === document ? root : doc;
    for (const [name, handler] of Object.entries(handlers))
      target.addEventListener(name, handler, {
        capture: true,
        passive: false,
      });
    documents.set(doc, {
      target,
      handlers,
    });
  }
  const load = (e) => {
    const activeDocs = new Set([e.detail.doc, ...view.renderer.getContents().map((x) => x.doc)]);
    for (const [doc, { target, handlers }] of documents) {
      if (doc !== document && !activeDocs.has(doc)) {
        for (const [name, handler] of Object.entries(handlers))
          target.removeEventListener(name, handler, true);
        documents.delete(doc);
      }
    }
    attach(e.detail.doc);
  };
  const relocate = () => {
    if (!busy && !gesture) {
      cache = null;
      root.dataset.previewReady = 'false';
      schedule();
    }
  };
  const resize = new ResizeObserver(() => {
    clearQueue();
    if (gesture || engine) {
      gesture = null;
      destroyEngine();
      busy = false;
      status('idle');
    }
    cache = null;
    root.dataset.previewReady = 'false';
    geometry();
    schedule();
  });
  resize.observe(root);
  const blur = () => {
    setTimeout(() => {
      if (!alive || document.hasFocus()) return;
      clearQueue();
      const g = gesture;
      if (g)
        finish(
          {
            pointerId: g.id,
            clientX: g.last.x + root.getBoundingClientRect().left,
            clientY: g.last.y + root.getBoundingClientRect().top,
            preventDefault() {},
          },
          null,
          true,
        );
    }, 0);
  };
  window.addEventListener('blur', blur);
  view.renderer.setAttribute('data-external-page-gestures', '');
  attach(document);
  for (const { doc } of view.renderer.getContents()) attach(doc);
  view.addEventListener('load', load);
  view.addEventListener('relocate', relocate);
  status('idle');
  queueCount();
  geometry();
  schedule();
  return {
    turn,
    invalidate() {
      cache = null;
      root.dataset.previewReady = 'false';
      if (options.isBlocked() || options.getSettings().mode !== 'curl') {
        clearQueue();
        gesture = null;
        destroyEngine();
        busy = false;
        status('idle');
      }
      geometry();
      schedule();
    },
    destroy() {
      clearQueue();
      alive = false;
      clearTimeout(warmTimer);
      clearTimeout(settleTimer);
      destroyEngine();
      resize.disconnect();
      view.renderer?.removeAttribute('data-external-page-gestures');
      view.removeEventListener('load', load);
      view.removeEventListener('relocate', relocate);
      window.removeEventListener('blur', blur);
      for (const { target, handlers } of documents.values())
        for (const [name, handler] of Object.entries(handlers))
          target.removeEventListener(name, handler, true);
      documents.clear();
      gesture = null;
      pageMemo.clear();
      pageLinks.clear();
      delete root.dataset.turnState;
      delete root.dataset.queuedTurns;
    },
  };
}
