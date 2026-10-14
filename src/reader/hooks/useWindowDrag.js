import React from 'react';
export function useWindowDrag() {
  const windowDragRef = React.useRef(null);
  const updateWindowDrag = (D) => {
    !D.ready ||
      D.frame ||
      (D.frame = window.requestAnimationFrame(() => {
        D.frame = 0;
        windowDragRef.current === D &&
          window.clearleaf.window.setPosition({
            x: D.startWindowX + D.currentScreenX - D.startScreenX,
            y: D.startWindowY + D.currentScreenY - D.startScreenY,
          });
      }));
  };
  const startWindowDrag = (D) => {
    if (D.button !== 0 || D.target.closest('button,input,textarea,select')) return;
    D.preventDefault();
    D.stopPropagation();
    D.currentTarget.setPointerCapture(D.pointerId);
    const P = Math.round(window.screenX);
    const n0 = Math.round(window.screenY);
    const C0 = {
      pointerId: D.pointerId,
      startScreenX: P + D.clientX,
      startScreenY: n0 + D.clientY,
      currentScreenX: P + D.clientX,
      currentScreenY: n0 + D.clientY,
      startWindowX: P,
      startWindowY: n0,
      ready: true,
      frame: 0,
    };
    windowDragRef.current = C0;
  };
  const moveWindowDrag = (D) => {
    const P = windowDragRef.current;
    !P ||
      P.pointerId !== D.pointerId ||
      ((P.currentScreenX = Math.round(window.screenX) + D.clientX),
      (P.currentScreenY = Math.round(window.screenY) + D.clientY),
      updateWindowDrag(P));
  };
  const endWindowDrag = (D) => {
    const P = windowDragRef.current;
    !P ||
      P.pointerId !== D.pointerId ||
      ((P.currentScreenX = Math.round(window.screenX) + D.clientX),
      (P.currentScreenY = Math.round(window.screenY) + D.clientY),
      P.frame && window.cancelAnimationFrame(P.frame),
      window.clearleaf.window.setPosition({
        x: P.startWindowX + P.currentScreenX - P.startScreenX,
        y: P.startWindowY + P.currentScreenY - P.startScreenY,
      }),
      (windowDragRef.current = null));
  };
  React.useEffect(
    () => () => {
      if (windowDragRef.current?.frame) cancelAnimationFrame(windowDragRef.current.frame);
      windowDragRef.current = null;
    },
    [],
  );
  return {
    startWindowDrag,
    moveWindowDrag,
    endWindowDrag,
  };
}
