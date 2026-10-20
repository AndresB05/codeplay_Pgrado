import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** `tutor`: panel sobrio, con el botón de peligro relleno y Cancelar en contorno. */
  variant?: 'default' | 'tutor';
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
  variant = 'default',
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

  /*
   * Al cuerpo del documento: montado dentro del <main isolate> del panel, su
   * z-50 no salía de ese contexto y el botón de plegar la barra quedaba encima
   * del velo. El foco empieza en Cancelar para que entre en el diálogo y un
   * Enter de inercia no confirme algo que no se deshace.
   */
  if (variant === 'tutor') {
    return createPortal(
      <div
        className="tutor-scope fixed inset-0 z-50 flex items-center justify-center bg-tutor-ink/40 px-4"
        role="presentation"
        onClick={onCancel}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          onClick={(event) => event.stopPropagation()}
          className="tutor-card w-full max-w-[460px] p-6 shadow-xl"
        >
          <h2 className="text-[20px] leading-tight text-tutor-ink">{title}</h2>

          <div className="mt-3 text-[15px] leading-[1.6] text-tutor-ink-soft">{children}</div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onConfirm} className="tutor-btn tutor-btn-danger-solid">
              {confirmLabel}
            </button>

            <button
              type="button"
              onClick={onCancel}
              autoFocus
              className="tutor-btn tutor-btn-secondary"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

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
