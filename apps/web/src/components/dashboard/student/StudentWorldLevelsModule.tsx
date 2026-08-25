import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { MonsteraLeaf, PalmFrond } from '../../decor/JungleDecor';
import { getCardToneStyles, studentWorlds } from './worlds/worldsData';

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

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 10V8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8V10"
      stroke="#2A1B45"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <rect
      x="5"
      y="10"
      width="14"
      height="9"
      rx="3"
      fill="#E3D9F7"
      stroke="#2A1B45"
      strokeWidth="2.4"
    />
  </svg>
);

const LEVEL_TITLES = [
  'plataformas',
  'saltos',
  'secuencias',
  'bloques',
  'retos',
  'bucles',
  'rutas',
  'objetos',
  'patrones',
  'meta',
];

type StudentWorldLevelsModuleProps = {
  worldId: string;
};

export const StudentWorldLevelsModule = ({ worldId }: StudentWorldLevelsModuleProps) => {
  const navigate = useNavigate();

  const world = useMemo(
    () => studentWorlds.find((item) => item.id === worldId) ?? studentWorlds[0],
    [worldId]
  );
  const tone = getCardToneStyles(world.tone);
  const Icon = iconByTone[world.tone];

  const levels = LEVEL_TITLES.map((title, index) => {
    const levelNumber = index + 1;

    return {
      levelNumber,
      title,
      isCompleted: levelNumber <= world.completedLevels,
      isCurrent: levelNumber === world.completedLevels + 1,
      isLocked: levelNumber > world.completedLevels + 1,
      description: `Curso de diseño de juegos · nivel ${levelNumber}`,
    };
  });

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

              <h1 className="title-xl mt-3">{world.title}</h1>
              <p className="subtitle mt-1 max-w-[620px]">{world.description}</p>
            </div>
          </div>

          <div className={`rounded-[22px] border-2 border-line px-5 py-4 text-right ${tone.soft}`}>
            <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
              Progreso actual
            </p>
            <p className={`mt-1 font-display text-[32px] leading-none ${tone.text}`}>
              {world.completedLevels}/{world.totalLevels}
            </p>
            <p className="mt-1 text-[14px] font-bold text-ink-soft">niveles superados</p>
          </div>
        </div>
      </section>

      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="title-lg">Selecciona un nivel</h2>
            <p className="subtitle mt-1">Cada mundo tiene 10 niveles para avanzar paso a paso.</p>
          </div>

          <span className={`chip ${tone.chip}`}>{world.difficultyLabel}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {levels.map((level) => {
            const headerBackground = level.isLocked ? '#E3D9F7' : tone.gradient;

            return (
              <button
                key={level.levelNumber}
                type="button"
                disabled={level.isLocked}
                className={`card overflow-hidden text-left transition-transform duration-100 ${
                  level.isLocked
                    ? 'cursor-not-allowed opacity-70'
                    : 'hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                <div
                  className="flex items-center justify-between border-b-[3px] border-ink px-3 py-2"
                  style={{ background: headerBackground }}
                >
                  <span
                    className={`font-display text-[14px] ${level.isLocked ? 'text-ink-soft' : 'text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]'}`}
                  >
                    Nivel {level.levelNumber}
                  </span>

                  {level.isCompleted ? (
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

                  {level.isCurrent ? (
                    <span className="rounded-full border-2 border-ink bg-sun px-2 py-0.5 font-display text-[11px] text-ink">
                      Aquí vas
                    </span>
                  ) : null}

                  {level.isLocked ? <LockIcon /> : null}
                </div>

                <div className="px-3 pt-3">
                  {/* Hueco reservado para la ilustración del nivel. */}
                  <div className="flex h-[110px] items-center justify-center rounded-[16px] border-[3px] border-dashed border-line bg-cream font-display text-[13px] text-ink-faint">
                    Imagen Nivel
                  </div>
                </div>

                <div className="px-3 pb-4 pt-3 text-center">
                  <div className="font-display text-[17px] capitalize text-ink">{level.title}</div>
                  <p className="mt-1 text-[12px] font-semibold leading-[1.4] text-ink-soft">
                    {level.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
