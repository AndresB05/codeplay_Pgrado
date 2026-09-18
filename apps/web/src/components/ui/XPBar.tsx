import {
  XP_PER_EXPLORER_LEVEL,
  explorerLevel,
  xpIntoExplorerLevel,
} from '../../constants/progress';

interface XPBarProps {
  xp: number;
  showLabel?: boolean;
}

/*
 * La barra del XP, que desde el J11 marca TRAMOS y no un techo: se llena, sube
 * el Nivel Explorador y vuelve a empezar. Ver `constants/progress.ts`.
 *
 * Recibe el XP y nada más. Antes recibía también el máximo, y eso permitía que
 * cada sitio pasara el suyo —el banner huérfano pasaba 1000 a mano—: con un solo
 * dato, que las cuatro barras cuenten igual deja de depender de quien las monta.
 */
export const XPBar = ({ xp, showLabel = true }: XPBarProps) => {
  const level = explorerLevel(xp);
  const inLevel = xpIntoExplorerLevel(xp);
  const percentage = (inLevel / XP_PER_EXPLORER_LEVEL) * 100;

  return (
    <div className="flex flex-col gap-1">
      {showLabel && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[14px] text-ink">Nivel Explorador {level}</span>
          <span className="text-[12px] font-semibold text-ink-soft">
            {inLevel} / {XP_PER_EXPLORER_LEVEL} XP
          </span>
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-jungle-soft">
        <div
          className="h-full bg-gradient-to-r from-jungle-light to-jungle transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
