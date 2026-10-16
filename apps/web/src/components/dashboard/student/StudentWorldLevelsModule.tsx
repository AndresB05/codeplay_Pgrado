import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import levelCaminoConCurvas from '../../../assets/brand/level-camino-con-curvas.webp';
import levelDosCaminos from '../../../assets/brand/level-dos-caminos.webp';
import levelElFaro from '../../../assets/brand/level-el-faro.webp';
import levelElGranRodeo from '../../../assets/brand/level-el-gran-rodeo.webp';
import levelLaEscalera from '../../../assets/brand/level-la-escalera.webp';
import levelLaTorre from '../../../assets/brand/level-la-torre.webp';
import levelMuchosCaminos from '../../../assets/brand/level-muchos-caminos.webp';
import levelSaltaYSube from '../../../assets/brand/level-salta-y-sube.webp';
import levelSiempreAdelante from '../../../assets/brand/level-siempre-adelante.webp';
import { ROUTES } from '../../../constants/routes';
import { useProgress } from '../../../hooks/useProgress';
import { useWorldLocks } from '../../../hooks/useWorldLocks';
import { worldsService } from '../../../services/worlds.service';
import type { User } from '../../../types/user.types';
import type { Level, World } from '../../../types/world.types';
import { MonsteraLeaf } from '../../decor/JungleDecor';
import { LoadingLeo } from '../../ui/LoadingLeo';
import { BackSign } from './BackSign';
import { blockingLevel } from './levelLock';
import { LockIcon } from './LockIcon';
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

/*
 * Por slug y no por posición: la ilustración pinta el título del nivel, y si un
 * nivel se reordena la imagen tiene que irse con él. `position` desplaza el
 * recorte cuando el leopardo no está centrado: en tableta la tarjeta se estrecha
 * y un recorte al centro lo dejaría fuera.
 */
const LEVEL_ART: Record<string, { src: string; position?: string }> = {
  'siempre-adelante': { src: levelSiempreAdelante },
  'camino-con-curvas': { src: levelCaminoConCurvas, position: '35% 50%' },
  'la-escalera': { src: levelLaEscalera, position: '35% 50%' },
  'salta-y-sube': { src: levelSaltaYSube },
  'el-gran-rodeo': { src: levelElGranRodeo },
  'la-torre': { src: levelLaTorre, position: '45% 50%' },
  'dos-caminos': { src: levelDosCaminos },
  'el-faro': { src: levelElFaro },
  'muchos-caminos': { src: levelMuchosCaminos, position: '75% 50%' },
};

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
  const { blockerOf, loading: locksLoading } = useWorldLocks(user?.id ?? null);
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

  /*
   * Se espera al candado antes de enseñar la lista: abierta por defecto, se
   * vería un instante la de un mundo cerrado al llegar escribiendo la dirección.
   */
  if (state.status === 'loading' || locksLoading) {
    return (
      <div className="flex min-h-[calc(100vh-84px)] items-center justify-center px-5 py-5">
        <LoadingLeo label="Cargando los niveles…" />
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

          <BackSign onClick={() => navigate(ROUTES.WORLDS)} className="mt-5">
            Volver a mundos
          </BackSign>
        </section>
      </div>
    );
  }

  const blocker = blockerOf(worldId);

  if (blocker !== null) {
    return (
      <div className="px-5 py-5">
        <section className="card p-6 text-center">
          <h1 className="title-lg">{state.world.name} todavía está cerrado</h1>
          <p className="subtitle mx-auto mt-2 max-w-[520px]">Primero supera {blocker.name}.</p>

          <BackSign onClick={() => navigate(ROUTES.WORLDS)} className="mt-5">
            Volver a mundos
          </BackSign>
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
   * El candado de aquí es sólo lo que se ve: el que cuenta está en la pantalla
   * de nivel, que es donde lleva la dirección escrita a mano. «Aquí vas» sale
   * del primer nivel sin completar.
   */
  const currentPosition = levels.findIndex((level) => !completedIds.has(level.id));

  const cards = levels.map((level, position) => ({
    level,
    isCompleted: completedIds.has(level.id),
    isCurrent: position === currentPosition,
    isLocked: blockingLevel(levels, level.id, completedIds) !== null,
  }));

  const completedCount = cards.filter((card) => card.isCompleted).length;

  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden p-6">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div
              className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-[26px] border-[3px] border-ink shadow-[0_6px_0_rgba(42,27,69,0.18)]"
              style={{ background: tone.gradient }}
            >
              <Icon />
            </div>

            <div>
              <BackSign onClick={() => navigate(ROUTES.WORLDS)}>Volver a mundos</BackSign>

              <h1 className="title-xl mt-3">{world.name}</h1>
              <p className="subtitle mt-1 max-w-[620px]">{world.description}</p>
            </div>
          </div>

          {/* Una notita de pergamino escrita a mano; el color del mundo queda en la cifra. */}
          <div className="note-paper note-paper-bold -rotate-[2deg] px-4 py-1 text-right">
            <p className="font-map text-[17px] uppercase tracking-[0.06em] text-sepia-soft">
              Progreso actual
            </p>
            <p className={`font-display text-[34px] leading-none ${tone.text}`}>
              {completedCount}/{levels.length}
            </p>
            <p className="mt-1 font-map text-[18px] text-sepia">niveles superados</p>
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
            {cards.map(({ level, isCompleted, isCurrent, isLocked }, position) => {
              const art = LEVEL_ART[level.slug];

              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => navigate(`${ROUTES.WORLDS}/${world.id}/${level.id}`)}
                  title={isLocked ? 'Supera el nivel anterior para abrirlo' : undefined}
                  className={`relative isolate flex flex-col px-5 pb-6 pt-5 text-left transition-transform duration-100 ${
                    isLocked
                      ? 'cursor-not-allowed opacity-60 grayscale'
                      : 'hover:-translate-y-1 active:translate-y-0'
                  }`}
                >
                  {/*
                   * Cada nivel, una hoja de pergamino. Lo que antes iba en la franja
                   * de color es ahora un sello de tinta: superado, en curso o cerrado.
                   */}
                  <div
                    aria-hidden
                    className="map-sheet pointer-events-none absolute inset-0 -z-10 [border-width:30px]"
                  />

                  <div className="flex min-h-[34px] items-center justify-between gap-2 px-1">
                    <span className="font-map text-[20px] leading-none text-sepia">
                      Nivel {position + 1}
                    </span>

                    {isCompleted ? (
                      <span className="flex -rotate-[8deg] items-center gap-1 rounded-md border-[3px] border-double border-jungle-dark px-2 font-map text-[17px] uppercase tracking-[0.04em] text-jungle-dark">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 12.5L10 17.5L19 7"
                            stroke="currentColor"
                            strokeWidth="3.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Superado
                      </span>
                    ) : null}

                    {isCurrent ? (
                      <span className="-rotate-[6deg] rounded-md border-[3px] border-double border-papaya-dark px-2 font-map text-[17px] uppercase tracking-[0.04em] text-papaya-dark">
                        Aquí vas
                      </span>
                    ) : null}

                    {isLocked ? (
                      <span className="flex -rotate-[4deg] items-center gap-1 rounded-md border-[3px] border-double border-sepia px-2 font-map text-[17px] uppercase tracking-[0.04em] text-sepia">
                        <LockIcon />
                        Bloqueado
                      </span>
                    ) : null}
                  </div>

                  <div className="pt-2">
                    {art ? (
                      <img
                        src={art.src}
                        alt=""
                        className="block h-[110px] w-full rounded-[16px] border-[3px] border-ink object-cover"
                        style={{ objectPosition: art.position }}
                      />
                    ) : (
                      // Hueco reservado para la ilustración del nivel.
                      <div className="flex h-[110px] items-center justify-center rounded-[16px] border-[3px] border-dashed border-line bg-cream font-display text-[13px] text-ink-faint">
                        Imagen Nivel
                      </div>
                    )}
                  </div>

                  <div className="flex-1 px-1 pt-3 text-center">
                    <div className="map-title font-display text-[18px] text-sepia">
                      {level.name}
                    </div>
                    <p className="mt-1 font-map text-[16px] leading-[1.3] text-sepia-soft">
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
