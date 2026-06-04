import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { getCardToneStyles, studentWorlds } from './worlds/worldsData';

const ForestIcon = () => (
  <svg width="74" height="74" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 62L39 36L54 62H24ZM38 62L52 43L66 62H38Z"
      stroke="#2F8A87"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <path d="M39 62V74M52 62V74M59 62V74" stroke="#2F8A87" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const VolcanoIcon = () => (
  <svg width="74" height="74" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 69L40 40H52L66 69H26Z" stroke="#C79B46" strokeWidth="5" strokeLinejoin="round" />
    <path
      d="M46 24V34M38 29L34 21M54 29L58 21"
      stroke="#C79B46"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

const OceanIcon = () => (
  <svg width="74" height="74" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M28 43C33 39 38 39 43 43C48 47 53 47 58 43C63 39 68 39 73 43"
      stroke="#9B6AE0"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M28 55C33 51 38 51 43 55C48 59 53 59 58 55C63 51 68 51 73 55"
      stroke="#9B6AE0"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

const iconByTone = {
  forest: ForestIcon,
  volcano: VolcanoIcon,
  ocean: OceanIcon,
};

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 6L9 12L15 18"
      stroke="#6D42D9"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

  const levels = Array.from({ length: 10 }, (_, index) => {
    const levelNumber = index + 1;
    const isCompleted = levelNumber <= world.completedLevels;
    const isCurrent = levelNumber === world.completedLevels + 1;
    const isLocked = levelNumber > world.completedLevels + 1;
    const levelTitles = [
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

    return {
      levelNumber,
      isCompleted,
      isCurrent,
      isLocked,
      title: levelTitles[index],
      description: `Curso de diseño de juegos · nivel ${levelNumber}`,
    };
  });

  return (
    <div className="px-6 py-6">
      <section className="rounded-[18px] border border-[#DDD5EA] bg-white p-6 shadow-[0_10px_24px_rgba(124,58,237,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-[96px] w-[96px] items-center justify-center rounded-[20px] ${tone.surface}`}
            >
              <Icon />
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.WORLDS)}
                className="inline-flex items-center gap-2 rounded-full bg-[#F3EEFD] px-4 py-2 text-[14px] font-semibold text-[#6D42D9]"
              >
                <BackIcon />
                Volver a mundos
              </button>
              <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.04em] text-[#231F2D]">
                {world.title}
              </h1>
              <p className="mt-2 max-w-[620px] text-[17px] leading-[1.55] text-[#5E576E]">
                {world.description}
              </p>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E3DCEE] bg-[#FAF8FE] px-5 py-4 text-right">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#8E83A8]">
              Progreso actual
            </p>
            <p className="mt-1 text-[28px] font-semibold text-[#231F2D]">
              {world.completedLevels}/10
            </p>
            <p className="text-[14px] text-[#7A728A]">niveles superados</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-[#DDD5EA] bg-white p-6 shadow-[0_8px_18px_rgba(124,58,237,0.05)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#E8E1F3] pb-4">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#231F2D]">
              Selecciona un nivel
            </h2>
            <p className="mt-1 text-[15px] text-[#6A637A]">
              Cada mundo tiene 10 niveles para avanzar paso a paso.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {levels.map((level) => {
            const stateClasses = level.isCompleted
              ? 'border-[#8B5CF6] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2FE_100%)] text-[#6D42D9]'
              : level.isCurrent
                ? 'border-[#F4B547] bg-[linear-gradient(180deg,#FFF8E9_0%,#FFF1CB_100%)] text-[#A46906]'
                : 'border-[#DAD3E8] bg-white text-[#A39BB3]';

            return (
              <button
                key={level.levelNumber}
                type="button"
                disabled={level.isLocked}
                className={`overflow-hidden rounded-[18px] border-[2px] text-left shadow-[0_8px_18px_rgba(124,58,237,0.04)] transition-transform duration-150 ${stateClasses} ${level.isLocked ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5'}`}
              >
                <div
                  className={`flex items-center justify-between border-b border-[#E8E1F3] px-3 py-2 ${tone.surface}`}
                >
                  <span className="text-[13px] font-semibold text-[#231F2D]">Nivel</span>
                  <span className="text-[20px] font-semibold leading-none text-[#231F2D]">
                    {level.levelNumber}
                  </span>
                </div>

                <div className="px-3 pt-3">
                  <div className="flex h-[110px] items-center justify-center rounded-[12px] border border-[#DCD4EA] bg-white text-[13px] font-medium text-[#A39BB3]">
                    Imagen Nivel
                  </div>
                </div>

                <div className="bg-white px-3 pb-3 pt-3 text-center">
                  <div className="text-[16px] font-semibold capitalize tracking-[-0.02em] text-[#231F2D]">
                    {level.title}
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.35] text-[#6A637A]">
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
