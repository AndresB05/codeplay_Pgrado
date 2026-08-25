import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo modal de confirmación para acciones que no se pueden deshacer.
 * Se cierra con Escape y al pulsar fuera del panel.
 */
export const ConfirmDialog = ({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1B45]/50 px-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[480px] rounded-[26px] border-[3px] border-[#2A1B45] bg-white p-7 shadow-[0_16px_0_rgba(42,27,69,0.18)]"
      >
        <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#2A1B45]">{title}</h2>

        <div className="mt-3 text-[16px] leading-[1.7] text-[#5A5170]">{children}</div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="h-[52px] flex-1 rounded-full border-b-[5px] border-[#B32020] bg-[#FF4D4D] px-6 text-[16px] font-extrabold text-white transition-all hover:brightness-105 active:translate-y-[3px] active:border-b-[2px]"
          >
            {confirmLabel}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="h-[52px] flex-1 rounded-full border-b-[5px] border-[#C9BEE4] bg-[#EFE9FB] px-6 text-[16px] font-extrabold text-[#5A4B7C] transition-all hover:brightness-[0.98] active:translate-y-[3px] active:border-b-[2px]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
