function installClearleafPressFeedback() {
  const selector =
    '.app-root button:not(.reader-scrim), .app-root input[type="checkbox"], .app-root input[type="radio"]';
  const pointers = new Map();
  const release = (pointerId) => {
    const control = pointers.get(pointerId);
    if (!control) return;
    pointers.delete(pointerId);
    if (![...pointers.values()].includes(control)) control.removeAttribute('data-cl-pressed');
  };
  const press = (event) => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    const control = event.target.closest(selector);
    if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
    release(event.pointerId);
    pointers.set(event.pointerId, control);
    control.setAttribute('data-cl-pressed', '');
  };
  const leave = (event) => {
    const control = pointers.get(event.pointerId);
    if (
      control &&
      event.target instanceof Element &&
      control.contains(event.target) &&
      (!event.relatedTarget || !control.contains(event.relatedTarget))
    )
      release(event.pointerId);
  };
  const clear = () => {
    for (const id of [...pointers.keys()]) release(id);
  };
  const visibility = () => {
    if (document.hidden) clear();
  };
  document.addEventListener('pointerdown', press, {
    capture: true,
    passive: true,
  });
  const finish = (event) => release(event.pointerId);
  document.addEventListener('pointerup', finish, {
    capture: true,
    passive: true,
  });
  document.addEventListener('pointercancel', finish, {
    capture: true,
    passive: true,
  });
  document.addEventListener('pointerout', leave, {
    capture: true,
    passive: true,
  });
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    clear();
    document.removeEventListener('pointerdown', press, true);
    document.removeEventListener('pointerup', finish, true);
    document.removeEventListener('pointercancel', finish, true);
    document.removeEventListener('pointerout', leave, true);
    window.removeEventListener('blur', clear);
    document.removeEventListener('visibilitychange', visibility);
  };
}
export { installClearleafPressFeedback };
