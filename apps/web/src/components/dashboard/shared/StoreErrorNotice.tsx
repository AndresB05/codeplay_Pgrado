import type { AppError } from '../../../errors/AppError';

interface StoreErrorNoticeProps {
  error: AppError | null;
  variant?: 'default' | 'tutor';
}

/**
 * Motivo por el que una acción sobre salones no salió adelante.
 *
 * Vive aparte porque lo montan las tres pantallas que escriben, y porque el
 * error tiene que aparecer donde se pulsó el botón: dejarlo sólo en el estado
 * del contexto lo hace indistinguible de un botón roto.
 */
export const StoreErrorNotice = ({ error, variant = 'default' }: StoreErrorNoticeProps) => {
  if (!error) {
    return null;
  }

  if (variant === 'tutor') {
    return (
      <p
        role="alert"
        className="mb-4 rounded-[8px] border border-tutor-danger/30 bg-tutor-danger-soft px-4 py-2.5 text-[14.5px] font-semibold leading-snug text-tutor-danger"
      >
        {error.message}
      </p>
    );
  }

  return (
    /*
     * `.chip` es `inline-flex` y encoge a `min-content`: en móvil el aviso salía
     * como una tira vertical de una letra por línea. Se conservan sus colores y
     * su tipografía, y se le impone caja de bloque.
     */
    <p role="alert" className="chip chip-coral mb-4 block w-full rounded-[18px] px-4 py-2.5 text-[15px] leading-snug">
      {error.message}
    </p>
  );
};
