import { useEffect } from 'react';
import type { AttemptOutcome } from '../../../types/progress.types';

interface LevelCompleteDialogProps {
  steps: number;
  optimalSteps: number;
  /* La puntuación que el juego calcula al terminar, para no dejar el hueco vacío. */
  score: number;
  /* Lo que el servidor concedió. `null` mientras viaja, y si el guardado falló. */
  outcome: AttemptOutcome | null;
  /* La partida no se pudo guardar. Se dice sin alarmar: el nivel está superado igual. */
  saveFailed: boolean;
  onExit: () => void;
  /* Sin nivel siguiente en el mundo no llega, y el botón no se pinta. */
  onNext?: () => void;
  /* Devuelve al personaje a la salida y deja los bloques, para mejorar el programa. */
  onRetry: () => void;
  onClose: () => void;
}

const stepsLabel = (count: number): string => (count === 1 ? '1 paso' : `${count} pasos`);

/*
 * La felicitación al llegar a la meta. Sale SIEMPRE que se llega, decidido por
 * el usuario: con pasos de más también se felicita, y lo que sobra se dice como
 * un reto y no como un fallo.
 *
 * LA XP QUE ENSEÑA ES LA QUE SE CONCEDIÓ, desde el J10. Hasta entonces enseñaba
 * la `xp_reward` de la fila —«+100 XP» siempre—, que era un recordatorio pedido
 * por el usuario y dejó de ser verdad el día que la puntuación empezó a decidir
 * cuánta se gana.
 *
 * Y por eso el número va en dos tiempos: la PUNTUACIÓN se enseña al instante,
 * porque el juego la calcula con la misma regla que el servidor (§3), y la XP
 * espera a la respuesta. Cuánta se gana depende de la marca anterior, que aquí
 * no se conoce, así que inventarla sería volver al problema que este paso
 * arregla. Mientras viaja no se enseña nada en su lugar: aparece cuando llega.
 *
 * No lleva mascota: su hueco espera a las ilustraciones definitivas.
 *
 * Escape la cierra para volver a mirar el tablero; pulsar fuera, no, porque un
 * clic de más al terminar se la llevaría antes de leerla.
 */
export const LevelCompleteDialog = ({
  steps,
  optimalSteps,
  score,
  outcome,
  saveFailed,
  onExit,
  onNext,
  onRetry,
  onClose,
}: LevelCompleteDialogProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const perfect = steps <= optimalSteps;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-complete-title"
        className="card w-full max-w-[480px] p-7 text-center shadow-[0_16px_0_rgba(42,27,69,0.18)]"
      >
        <h2 id="level-complete-title" className="title-xl">
          {perfect ? '¡Nivel perfecto!' : '¡Nivel completado!'}
        </h2>

        <p className="subtitle mt-3">
          {perfect
            ? `Llegaste a la meta con ${stepsLabel(steps)}, lo mismo que la mejor solución.`
            : `Llegaste a la meta con ${stepsLabel(steps)}. La mejor solución usa ${stepsLabel(optimalSteps)}: ¿te atreves a intentarlo con menos?`}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <span className="chip chip-grape">Tus pasos: {steps}</span>
          <span className="chip chip-mint">Mejor solución: {optimalSteps}</span>
          <span className="chip chip-sky">Puntuación: {score}</span>
          {outcome !== null && outcome.awardedXp > 0 && (
            <span className="chip chip-sun">+{outcome.awardedXp} XP</span>
          )}
        </div>

        {/*
         * Volver a superarlo sin mejorar no gana nada, y eso se dice entero:
         * que no hay XP nueva y por qué, con la marca que ya tenía delante. Sin
         * el motivo parecería que el juego se olvidó de pagar.
         */}
        {outcome !== null && outcome.awardedXp === 0 && (
          <p className="mt-4 text-[14px] font-semibold text-ink-soft">
            Tu mejor marca en este nivel sigue siendo {outcome.bestScore}, así que esta vez no
            ganaste XP nueva. ¡Supérala y te llevas la diferencia!
          </p>
        )}

        {/*
         * El guardado falló y se dice, porque si no el niño vuelve al mundo y
         * no encuentra el nivel que acaba de superar. No se le pide que haga
         * nada: volver a jugarlo lo guarda, y repetir no le quita nada (§6).
         */}
        {saveFailed && (
          <p className="mt-4 text-[14px] font-semibold text-ink-soft">
            No pudimos guardar esta partida. Vuelve a intentarlo cuando quieras y se guardará.
          </p>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={onExit} className="btn btn-ghost flex-1">
            Salir al mundo
          </button>

          <button type="button" onClick={onRetry} className="btn btn-sky flex-1">
            Volver a intentar
          </button>

          {onNext !== undefined && (
            <button type="button" onClick={onNext} className="btn btn-mint flex-1">
              Siguiente nivel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
