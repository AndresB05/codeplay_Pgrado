import { useEffect } from 'react';

interface LevelCompleteDialogProps {
  steps: number;
  optimalSteps: number;
  /* La `xp_reward` de la fila. Se enseña, pero todavía no se concede. */
  xpReward: number;
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
 * LA XP QUE ENSEÑA NO SE CONCEDE TODAVÍA. El usuario la pidió en la ventana el
 * 14-sep-2026 para no olvidarla, y es la `xp_reward` de la fila tal cual. Lo que
 * de verdad se gana lo calculará el servidor en el J10 —80 al completar y 20 al
 * mejorar, nunca más de 100—, y ese día este número tiene que salir de ahí.
 *
 * No lleva mascota: su hueco espera a las ilustraciones definitivas.
 *
 * Escape la cierra para volver a mirar el tablero; pulsar fuera, no, porque un
 * clic de más al terminar se la llevaría antes de leerla.
 */
export const LevelCompleteDialog = ({
  steps,
  optimalSteps,
  xpReward,
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
          <span className="chip chip-sun">+{xpReward} XP</span>
        </div>

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
