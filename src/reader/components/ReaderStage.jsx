import { BookMarked, LoaderCircle } from 'lucide-react';
import { SurfacePanel, ActionButton } from '../../components/Controls.jsx';
export function ReaderStage({ hostRef, ready, error, book, onBack }) {
  return (
    <main className="reader-stage">
      <div ref={hostRef} className="foliate-host" />
      {!ready && !error && (
        <div className="reader-loading">
          <LoaderCircle size={30} className="spin" />
          <span>
            {'正在展开《'}
            {book.title}
            {'》'}
          </span>
        </div>
      )}
      {error && (
        <SurfacePanel className="reader-error">
          <BookMarked size={34} />
          <h2>{'无法打开这本书'}</h2>
          <p>{error}</p>
          <ActionButton onClick={onBack}>{'返回书库'}</ActionButton>
        </SurfacePanel>
      )}
      {null}
    </main>
  );
}
