import { useEffect, useRef } from 'react';
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-resource-title"
        className="card flex max-h-full w-full max-w-[720px] flex-col shadow-[0_16px_0_rgba(42,27,69,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-ink px-6 py-5">
          <div>
            <span className="chip chip-mint">{resource.categoryLabel}</span>
            <h2 id="teacher-resource-title" className="title-lg mt-3">
              {resource.title}
            </h2>
            <p className="mt-1 text-[14px] font-bold text-ink-faint">
              {resourceReadMinutes(resource)} min de lectura
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-sm btn-ghost shrink-0"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {resource.sections.map((section) => (
            <section key={section.heading} className="mb-6 last:mb-0">
              <h3 className="font-display text-[18px] text-ink">{section.heading}</h3>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-2 text-[15px] font-semibold leading-[1.65] text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
