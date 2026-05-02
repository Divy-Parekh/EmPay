import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  /* Close on Escape */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
            id="modal-close-btn"
          >
            <X size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Body */}
        {children}
      </div>
    </div>
  );
}
