import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type WorldIntroProps = {
  image: string;
  bubbles: ReactNode[];
  onClose: () => void;
};

/* Algo más que la salida más larga: por si `animationend` no llega, que no se quede abierto. */
const LEAVE_FALLBACK_MS = 600;

const prefersMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Leo explicando un mundo: entra desde abajo y habla en burbujas cortas, porque
 * en la prueba los niños no leían el texto que no parecía importante.
 *
 * No sabe de qué mundo habla ni si ya se vio: eso lo decide quien lo monta, que
 * también es quien lo anota al cerrarse. Se cierra con el último botón, con
 * Escape y tocando el velo; tocar a Leo o la burbuja no, que es donde el niño
 * apoya el dedo para leer.
 *
 * El velo cubre SÓLO EL `<main>` del panel, decidido por el usuario: la barra
 * lateral y la superior se quedan a la vista. Va en un portal a ese `<main>`, que
 * es `relative isolate`, con `absolute inset-0`: así lo cubre entero aunque la
 * página haga scroll, y queda por encima de todo lo del módulo. Leo va `sticky`
 * abajo para seguir a la vista. La barra lateral se puede usar: navegar desmonta
 * el nivel, y con él este diálogo, sin anotarlo como visto.
 */
export const WorldIntro = ({ image, bubbles, onClose }: WorldIntroProps) => {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const closed = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const textId = useId();
  const isLast = index === bubbles.length - 1;

  const finish = useCallback(() => {
    if (!closed.current) {
      closed.current = true;
      onClose();
    }
  }, [onClose]);

  /* El cierre real espera a que Leo salga; sin movimiento no hay nada que esperar. */
  const requestClose = useCallback(() => {
    if (prefersMotion()) {
      setLeaving(true);
    } else {
      finish();
    }
  }, [finish]);

  useEffect(() => {
    if (!leaving) {
      return;
    }

    const veil = veilRef.current;
    // Sólo la del velo, que es la última en acabar; las de Leo y la burbuja suben hasta aquí.
    const handleEnd = (event: AnimationEvent) => {
      if (event.target === veil) {
        finish();
      }
    };
    const timer = window.setTimeout(finish, LEAVE_FALLBACK_MS);

    veil?.addEventListener('animationend', handleEnd);

    return () => {
      veil?.removeEventListener('animationend', handleEnd);
      window.clearTimeout(timer);
    };
  }, [finish, leaving]);

  useEffect(() => {
    const previous = document.activeElement;

    return () => {
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, []);

  useEffect(() => {
    buttonRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
      }

      // Hay un solo botón: Tab no tiene adónde ir sin salirse del diálogo.
      if (event.key === 'Tab') {
        event.preventDefault();
        buttonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestClose]);

  const motion = leaving ? 'leo-leave' : 'leo-enter';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={textId}
      ref={veilRef}
      onClick={requestClose}
      className={`${leaving ? 'leo-veil-out' : 'leo-veil'} leo-stage absolute inset-0 z-50 flex flex-col justify-end overflow-clip bg-ink/70`}
    >
      <div className="leo-layout sticky bottom-0">
        <img
          src={image}
          alt=""
          onClick={(event) => event.stopPropagation()}
          className={`${motion} leo-figure`}
        />

        <div
          onClick={(event) => event.stopPropagation()}
          className={`${motion} ${leaving ? '' : 'leo-enter-late'} leo-bubble relative w-full min-w-0 max-w-[480px] rounded-[28px] border-[3px] border-ink bg-cream shadow-[0_8px_0_rgba(42,27,69,0.25)]`}
        >
          {/* La cola de la burbuja, hacia la mano de Leo. En móvil la burbuja va encima y sobra. */}
          <span
            aria-hidden="true"
            className="leo-tail absolute -left-[13px] top-10 h-6 w-6 rotate-45 border-b-[3px] border-l-[3px] border-ink bg-cream"
          />

          <div
            id={textId}
            aria-live="polite"
            className="leo-bubble-text font-display leading-[1.35] text-ink"
          >
            {bubbles[index]}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-ink-faint">
              {index + 1} de {bubbles.length}
            </span>

            <button
              ref={buttonRef}
              type="button"
              onClick={isLast ? requestClose : () => setIndex((current) => current + 1)}
              className="btn btn-grape"
            >
              {isLast ? '¡Entendido!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.querySelector('main') ?? document.body
  );
};
