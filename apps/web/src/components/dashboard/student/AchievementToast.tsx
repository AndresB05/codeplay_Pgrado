import { useEffect, useState } from 'react';
import type { AchievementUnlock } from '../../../types/progress.types';

/*
 * EL AVISO DE LOGRO DESBLOQUEADO, pedido por el usuario «como en los juegos de
 * Steam»: aparece en una esquina, dice qué se ganó y se va solo.
 *
 * NO ROBA EL FOCO NI BLOQUEA. El niño acaba de terminar una partida y lo que
 * está mirando es su resultado; un diálogo encima le haría cerrar dos cosas para
 * volver a jugar. Por eso es `aria-live="polite"`: se anuncia sin interrumpir lo
 * que el lector de pantalla esté leyendo.
 *
 * VAN DE UNO EN UNO porque llegan en manojo: terminar el noveno nivel al 100
 * concede el del nivel, el del mundo y el de todo en la misma partida, y tres
 * tarjetas a la vez no se leen.
 */
const VISIBLE_MS = 4200;

/** Cuánto dura la salida. Tiene que cuadrar con la duración de la transición. */
const LEAVING_MS = 320;

const TrophyBadge = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8.5 4H15.5V9C15.5 10.93 13.93 12.5 12 12.5C10.07 12.5 8.5 10.93 8.5 9V4Z"
      fill="currentColor"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 5.5H6.3C5.3 5.5 4.5 6.3 4.5 7.3C4.5 9.5 6.3 11.3 8.5 11.3M15.5 5.5H17.7C18.7 5.5 19.5 6.3 19.5 7.3C19.5 9.5 17.7 11.3 15.5 11.3"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path d="M12 12.5V17M8.5 20H15.5" stroke="#2A1B45" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * La cola de avisos de una partida.
 *
 * Se le pasa lo que el servidor concedió y ella se encarga del resto. Con la
 * lista vacía no pinta nada, que es el caso normal: la mayoría de las partidas
 * no conceden ningún logro.
 */
export const AchievementToast = ({ unlocked }: { unlocked: AchievementUnlock[] }) => {
  const [queue, setQueue] = useState<AchievementUnlock[]>([]);
  const [leaving, setLeaving] = useState(false);

  /*
   * La cola se REEMPLAZA con lo que traiga cada partida en vez de acumularse:
   * los logros de la anterior ya se enseñaron, y encolarlos otra vez repetiría
   * el aviso al volver a jugar.
   */
  useEffect(() => {
    setQueue(unlocked);
    setLeaving(false);
  }, [unlocked]);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) {
      return;
    }

    setLeaving(false);

    const goes = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    const drops = window.setTimeout(() => {
      setQueue((pending) => pending.slice(1));
    }, VISIBLE_MS + LEAVING_MS);

    return () => {
      window.clearTimeout(goes);
      window.clearTimeout(drops);
    };
  }, [current]);

  if (!current) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 right-6 z-50 w-[min(340px,calc(100vw-3rem))] transition-all duration-300 ${
        leaving ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <article className="card flex items-start gap-3 border-[3px] border-ink bg-sun-soft p-4 shadow-[0_6px_0_rgba(42,27,69,0.25)]">
        <span className="shrink-0 text-sun-dark">
          <TrophyBadge />
        </span>

        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-sun-dark">
            ¡Logro desbloqueado!
          </p>

          <h3 className="font-display text-[18px] leading-tight text-ink">{current.title}</h3>

          <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-ink-soft">
            {current.description}
          </p>

          {current.awardedXp > 0 ? (
            <span className="chip chip-mint mt-2">+{current.awardedXp} XP</span>
          ) : null}
        </div>
      </article>

      {/*
       * Cuántos quedan detrás. Sin esto, un manojo de tres parece uno solo que
       * tarda en irse, y el niño no sabe que le espera algo más.
       */}
      {queue.length > 1 ? (
        <p className="mt-2 text-right text-[13px] font-bold text-ink-faint">
          y {queue.length - 1} más
        </p>
      ) : null}
    </div>
  );
};
