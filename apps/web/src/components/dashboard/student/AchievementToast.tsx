import { useEffect, useMemo, useState } from 'react';
import type { AchievementUnlock, MissionCompletionUnlock } from '../../../types/progress.types';

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
 *
 * LA MISMA COLA SIRVE PARA LAS MISIONES, y por eso no hay un componente aparte:
 * la misma partida puede conceder un logro y cumplir una misión, y con dos colas
 * las dos tarjetas se pintarían una encima de la otra. Lo que cambia es el
 * rótulo y el icono, porque una misión la puso su tutor y llamarla logro
 * confundiría las dos cosas.
 */
const VISIBLE_MS = 4200;

/** Cuánto dura la salida. Tiene que cuadrar con la duración de la transición. */
const LEAVING_MS = 320;

/** Una entrada de la cola: un logro o una misión, con qué rótulo anunciarla. */
type ToastEntry = {
  kind: 'achievement' | 'mission';
  key: string;
  title: string;
  description: string;
  awardedXp: number;
};

const TargetBadge = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="#2A1B45" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="5" stroke="#2A1B45" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="#2A1B45" strokeWidth="1.4" />
  </svg>
);

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
export const AchievementToast = ({
  unlocked,
  completedMissions,
}: {
  unlocked: AchievementUnlock[];
  completedMissions: MissionCompletionUnlock[];
}) => {
  const [queue, setQueue] = useState<ToastEntry[]>([]);
  const [leaving, setLeaving] = useState(false);

  /*
   * Los logros van delante de las misiones: el logro sale de lo que el niño
   * acaba de hacer en la partida, y la misión de lo que su tutor le puso
   * hace días. Lo primero explica lo segundo.
   */
  const entries = useMemo<ToastEntry[]>(
    () => [
      ...unlocked.map((achievement) => ({ kind: 'achievement' as const, ...achievement })),
      ...completedMissions.map((mission) => ({ kind: 'mission' as const, ...mission })),
    ],
    [unlocked, completedMissions]
  );

  /*
   * La cola se REEMPLAZA con lo que traiga cada partida en vez de acumularse:
   * los logros de la anterior ya se enseñaron, y encolarlos otra vez repetiría
   * el aviso al volver a jugar.
   */
  useEffect(() => {
    setQueue(entries);
    setLeaving(false);
  }, [entries]);

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
      className={`pointer-events-none fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-3rem))] transition-all duration-300 ${
        leaving ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      {/*
       * La misma tabla que los logros de la sala de trofeos, entre dos troncos
       * delgados como los de los grandes trofeos, para que el aviso y la sala
       * combinen. Los troncos van por encima y le tapan los bordes de arriba y
       * de abajo.
       */}
      <div className="trophy-log relative z-10 h-[30px]" aria-hidden="true" />

      <article className="wood-board mx-3 -mt-[9px] flex items-center gap-3 px-1 py-1">
        <span className="wood-well flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[16px] text-sun-dark">
          {current.kind === 'mission' ? <TargetBadge /> : <TrophyBadge />}
        </span>

        <div className="wood-bare min-w-0 flex-1 rounded-[12px] px-3 py-1.5">
          <p className="wood-deep text-[12px] font-bold uppercase tracking-[0.06em]">
            {current.kind === 'mission' ? '¡Misión cumplida!' : '¡Logro desbloqueado!'}
          </p>

          <h3 className="wood-deep font-display text-[18px] leading-tight">{current.title}</h3>

          <p className="wood-deep mt-0.5 text-[14px] font-semibold leading-[1.4]">
            {current.description}
          </p>

          {current.awardedXp > 0 ? (
            <span className="chip wood-well wood-carved mt-1.5 py-0.5">+{current.awardedXp} XP</span>
          ) : null}
        </div>
      </article>

      <div className="trophy-log relative z-10 -mt-[17px] h-[30px]" aria-hidden="true" />

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
