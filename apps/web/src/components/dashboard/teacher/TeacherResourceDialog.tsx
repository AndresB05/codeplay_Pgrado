import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TeacherResource } from '../../../types/classroom.types';
import { resourceReadMinutes } from './teacherResources';

interface TeacherResourceDialogProps {
  resource: TeacherResource;
  onClose: () => void;
}

/*
 * Pulsar fuera sí la cierra, al contrario que la ventana de nivel superado:
 * aquí no hay nada que perderse, y es la forma natural de salir de una lectura.
 */
export const TeacherResourceDialog = ({ resource, onClose }: TeacherResourceDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /*
   * Tab da la vuelta dentro de la ventana: sin esto, quien navega con teclado
   * acaba en los botones de la página oscurecida, que no ve. Al cerrar, el foco
   * vuelve a la tarjeta que la abrió para no perder el sitio.
   *
   * Corre una sola vez: el panel se relee cada 15 s y trae un `onClose` nuevo en
   * cada render, y repetir el efecto movería el foco sin que nadie lo pida.
   */
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      opener?.focus();
    };
  }, []);

  /* Al cuerpo del documento, como ConfirmDialog: dentro del <main isolate> el botón de plegar quedaba encima del velo. */
  return createPortal(
    <div
      className="tutor-scope fixed inset-0 z-50 flex items-center justify-center bg-tutor-ink/40 px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-resource-title"
        className="tutor-card flex max-h-full w-full max-w-[720px] flex-col shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-tutor-rule px-6 py-4">
          <div>
            <span className="tutor-badge tutor-badge-info tutor-badge-plain">
              {resource.categoryLabel}
            </span>
            <h2 id="teacher-resource-title" className="mt-2 text-[21px] leading-tight text-tutor-ink">
              {resource.title}
            </h2>
            <p className="mt-1 text-[14px] text-tutor-ink-soft">
              {resourceReadMinutes(resource)} min de lectura
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tutor-btn tutor-btn-secondary tutor-btn-sm shrink-0"
          >
            Cerrar
          </button>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label={resource.title}
          className="overflow-y-auto px-6 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tutor-accent"
        >
          {resource.sections.map((section) => (
            <section key={section.heading} className="mb-6 last:mb-0">
              <h3 className="text-[17px] leading-tight text-tutor-ink">{section.heading}</h3>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-2 max-w-[72ch] text-[15px] leading-[1.65] text-tutor-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
