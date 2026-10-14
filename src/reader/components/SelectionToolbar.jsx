import { MessageSquareText, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
export function SelectionToolbar({ selection, addHighlight, setSelection }) {
  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          className="selection-toolbar surface-panel no-drag"
          style={{
            left: selection.x,
            top: Math.max(86, selection.y - 58),
          }}
          initial={{
            opacity: 0,
            scale: 0.94,
            y: 4,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: 4,
          }}
          transition={{
            type: 'spring',
            bounce: 0.14,
            duration: 0.28,
          }}
        >
          {['#ffd75e', '#8ee6a2', '#8dc8ff', '#f2a6cf'].map((D) => (
            <button
              className="highlight-color"
              style={{
                '--highlight': D,
              }}
              onClick={() => void addHighlight(D)}
              aria-label="高亮"
              key={D}
            />
          ))}
          <span />
          <button onClick={() => void addHighlight('#ffd75e', true)}>
            <MessageSquareText size={16} />
            {' 笔记'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selection.text);
              selection.selection.removeAllRanges();
              setSelection(null);
            }}
          >
            <Copy size={16} />
            {' 复制'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
