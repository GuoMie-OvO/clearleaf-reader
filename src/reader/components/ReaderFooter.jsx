import { SurfacePanel } from '../../components/Controls.jsx';
export function ReaderFooter({ chapter, book, progress, setProgress, viewRef }) {
  return (
    <SurfacePanel className="reader-footer no-drag" role="contentinfo">
      <span>{chapter || book.extension.toUpperCase()}</span>
      <input
        aria-label="阅读进度"
        type="range"
        min={0}
        max={1}
        step={1e-3}
        value={progress}
        onChange={(D) => {
          const P = Number(D.target.value);
          setProgress(P);
          viewRef.current?.goToFraction(P);
        }}
      />
      <span>
        {Math.round(progress * 100)}
        {'%'}
      </span>
    </SurfacePanel>
  );
}
