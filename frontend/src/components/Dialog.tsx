import type { ReactNode } from 'react';
import { useId } from 'react';
import { useDialog } from '../lib/useDialog';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modal popup: dark overlay, focus kept inside, Esc / overlay click / × close it. */
export default function Dialog({ title, subtitle, className, onClose, children }: Props) {
  const ref = useDialog<HTMLDivElement>(onClose);
  const titleId = useId();

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={ref}
        className={className ? `modal ${className}` : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="sub">{subtitle}</p>}
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
