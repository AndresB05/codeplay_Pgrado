import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useProgress } from '../../../hooks/useProgress';
import { worldsService } from '../../../services/worlds.service';
import type { User } from '../../../types/user.types';
import type { Level, World } from '../../../types/world.types';
import { MonsteraLeaf, PalmFrond } from '../../decor/JungleDecor';
import { getCardToneStyles, type WorldModuleCard } from './worlds/worldsData';

const ForestIcon = () => <MonsteraLeaf size={64} color="#FFF9EF" />;

const VolcanoIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path
      d="M12 52L26 24H38L52 52H12Z"
      fill="#FFF9EF"
      stroke="#2A1B45"
      strokeWidth="3.4"
      strokeLinejoin="round"
    />
    <path d="M26 24C28 28 36 28 38 24" stroke="#2A1B45" strokeWidth="3.2" strokeLinecap="round" />
    <path
      d="M32 8V18M22 14L18 8M42 14L46 8"
      stroke="#2A1B45"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

const OceanIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path
      d="M8 26C14 20 20 20 26 26C32 32 38 32 44 26C50 20 54 20 58 24"
      stroke="#FFF9EF"
      strokeWidth="4.4"
      strokeLinecap="round"
    />
    <path
      d="M8 40C14 34 20 34 26 40C32 46 38 46 44 40C50 34 54 34 58 38"
      stroke="#FFF9EF"
      strokeWidth="4.4"
      strokeLinecap="round"
    />
    <circle cx="46" cy="16" r="5" fill="#FFF9EF" stroke="#2A1B45" strokeWidth="3" />
  </svg>
);

const iconByTone = {
  forest: ForestIcon,
  volcano: VolcanoIcon,
  ocean: OceanIcon,
};

/*
 * El bioma sale de la POSICIÓN del mundo en la lista ordenada, que es el mismo
 * criterio literal que usa la pantalla de mundos. No de su `sort_order`: hoy los
 * dos dan lo mismo —los tres mundos sembrados van 1, 2 y 3—, pero son dos reglas
 * distintas, y el día que se siembre un mundo con otro orden el mismo mundo
 * cambiaría de color entre las dos pantallas sin que nada lo delate.
 */
const TONES: WorldModuleCard['tone'][] = ['forest', 'volcano', 'ocean'];

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 6L9 12L15 18"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/*
 * Tres estados y no dos banderas: «cargando», «este mundo no existe» y «aquí
 * están sus niveles» se excluyen entre sí. Con banderas sueltas, el primer
 * repintado —cuando la consulta todavía no ha vuelto— anunciaría que el mundo no
 * está disponible, que es lo que hay que no hacer.
 */
type LevelsState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; world: World; index: number; levels: Level[] };

type StudentWorldLevelsModuleProps = {
  user: User | null;
  worldId: string;
};

export const StudentWorldLevelsModule = ({ user, worldId }: StudentWorldLevelsModuleProps) => {
  const navigate = useNavigate();
  const { progress } = useProgress(user?.id ?? null);
  const [state, setState] = useState<LevelsState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      /*
       * El mundo se resuelve POR SU IDENTIFICADOR contra las filas de la base.
       * Antes se buscaba entre los mundos de maqueta con un repliegue al
       * primero, así que cualquier uuid real acababa enseñando el mundo de
       * ejemplo: el nombre era de mentira y los niveles, de otro mundo.
       */
      const worldsResult = await worldsService.getWorlds();
      const worlds = worldsResult.data ?? [];
      const index = worlds.findIndex((item) => item.id === worldId);

      if (index === -1) {
        if (mounted) {
          setState({ status: 'missing' });
        }

        return;
      }

      const levelsResult = await worldsService.getLevelsByWorld(worldId);

      if (!mounted) {
        return;
      }

      setState({
        status: 'ready',
        world: worlds[index],
        index,
        levels: levelsResult.data ?? [],
      });
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [worldId]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-5">
        <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-line border-t-grape" />
        <span className="sr-only">Cargando los niveles…</span>
      </div>
    );
  }

  if (state.status === 'missing') {
    return (
      <div className="px-5 py-5">
        <section className="card p-6 text-center">
          <h1 className="title-lg">Este mundo no está disponible</h1>
          <p className="subtitle mx-auto mt-2 max-w-[520px]">
            Puede que lo hayan retirado. Vuelve al mapa y elige otro.
          </p>

          <button
            type="button"
            onClick={() => navigate(ROUTES.WORLDS)}
            className="btn btn-grape mt-5"
          >
            <BackIcon />
            Volver a mundos
          </button>
        </section>
      </div>
    );
  }

  const { world, index, levels } = state;
  const tone = getCardToneStyles(TONES[index % TONES.length]);
  const Icon = iconByTone[TONES[index % TONES.length]];

  const completedIds = new Set(
    progress.filter((item) => item.completionStatus === 'completed').map((item) => item.levelId)
  );

  /*
   * SIN CANDADO HASTA LA PRUEBA PRELIMINAR, decidido por el usuario el
   * 13-sep-2026: todos los niveles se abren desde aquí, y cómo se ordena el
   * avance se decide después (`docs/CONTEXT.md` §4.11). «Aquí vas» sale del
   * primer nivel sin completar y no de «desbloqueado y sin completar», que sin
   * candado marcaría todos.
   */
  const currentPosition = levels.findIndex((level) => !completedIds.has(level.id));

  const cards = levels.map((level, position) => ({
    level,
    isCompleted: completedIds.has(level.id),
    isCurrent: position === currentPosition,
  }));

  const completedCount = cards.filter((card) => card.isCompleted).length;

  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden p-6">
        <PalmFrond
          size={104}
          className="pointer-events-none absolute -right-6 -top-8 -scale-x-100 rotate-[14deg] opacity-70"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div
              className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-[26px] border-[3px] border-ink shadow-[0_6px_0_rgba(42,27,69,0.18)]"
              style={{ background: tone.gradient }}
            >
              <Icon />
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.WORLDS)}
                className="btn btn-sm btn-ghost"
              >
                <BackIcon />
                Volver a mundos
              </button>

              <h1 className="title-xl mt-3">{world.name}</h1>
              <p className="subtitle mt-1 max-w-[620px]">{world.description}</p>
            </div>
          </div>

          <div className={`rounded-[22px] border-2 border-line px-5 py-4 text-right ${tone.soft}`}>
            <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
              Progreso actual
            </p>
            <p className={`mt-1 font-display text-[32px] leading-none ${tone.text}`}>
              {completedCount}/{levels.length}
            </p>
            <p className="mt-1 text-[14px] font-bold text-ink-soft">niveles superados</p>
          </div>
        </div>
      </section>

      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="title-lg">Selecciona un nivel</h2>
            <p className="subtitle mt-1">{world.regionLabel}</p>
          </div>
        </div>

        {levels.length === 0 ? (
          <p className="mt-6 text-[15px] font-semibold text-ink-soft">
            Este mundo todavía no tiene niveles.
          </p>
        ) : (
          // Tres columnas y no más: cada mundo tiene tres niveles, y con más columnas sobraba medio ancho vacío.
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {cards.map(({ level, isCompleted, isCurrent }, position) => {
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => navigate(`${ROUTES.WORLDS}/${world.id}/${level.id}`)}
                  className="card flex flex-col overflow-hidden text-left transition-transform duration-100 hover:-translate-y-1 active:translate-y-0"
                >
                  <div
                    className="flex items-center justify-between border-b-[3px] border-ink px-3 py-2"
                    style={{ background: tone.gradient }}
                  >
                    <span className="font-display text-[14px] text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
                      Nivel {position + 1}
                    </span>

                    {isCompleted ? (
                      <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-ink bg-mint">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 12.5L10 17.5L19 7"
                            stroke="#FFF9EF"
                            strokeWidth="3.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    ) : null}

                    {isCurrent ? (
                      <span className="rounded-full border-2 border-ink bg-sun px-2 py-0.5 font-display text-[11px] text-ink">
                        Aquí vas
                      </span>
                    ) : null}
                  </div>

                  <div className="px-3 pt-3">
                    {/* Hueco reservado para la ilustración del nivel. */}
                    <div className="flex h-[110px] items-center justify-center rounded-[16px] border-[3px] border-dashed border-line bg-cream font-display text-[13px] text-ink-faint">
                      Imagen Nivel
                    </div>
                  </div>

                  <div className="flex-1 px-3 pb-4 pt-3 text-center">
                    <div className="font-display text-[17px] text-ink">{level.name}</div>
                    <p className="mt-1 text-[12px] font-semibold leading-[1.4] text-ink-soft">
                      {level.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
