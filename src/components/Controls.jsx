function SurfacePanel({ className: t = '', ...i }) {
  return <div className={`surface-panel ${t}`} {...i} />;
}
function ActionButton({ className: t = '', ...i }) {
  return <button className={`surface-button ${t}`} {...i} />;
}
export { SurfacePanel, ActionButton };
