import React from 'react';
import { Minus, Maximize2, Square, X } from 'lucide-react';
export default function WindowControls() {
  const [maximized, setMaximized] = React.useState(false);
  React.useEffect(() => {
    window.clearleaf.window.isMaximized().then(setMaximized);
    return window.clearleaf.window.onMaximized(setMaximized);
  }, []);
  return (
    <div className="window-controls no-drag" aria-label="窗口控制">
      <button aria-label="最小化" onClick={() => window.clearleaf.window.minimize()}>
        <Minus size={15} />
      </button>
      <button
        aria-label={maximized ? '还原' : '最大化'}
        onClick={() => window.clearleaf.window.toggleMaximize()}
      >
        {maximized ? <Square size={12} /> : <Maximize2 size={13} />}
      </button>
      <button
        className="window-close"
        aria-label="关闭"
        onClick={() => window.clearleaf.window.close()}
      >
        <X size={16} />
      </button>
    </div>
  );
}
