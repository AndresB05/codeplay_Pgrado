import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { User } from '../../../types/user.types';
import {
  type CategoryKey,
  type DifficultyKey,
  getCardToneStyles,
  studentWorlds,
  type ThemeKey,
  type WorldModuleCard,
} from './worlds/worldsData';
import { useWorlds } from '../../../hooks/useWorlds';
import { useProgress } from '../../../hooks/useProgress';
import { worldsService } from '../../../services/worlds.service';

const fallbackWorlds: WorldModuleCard[] = studentWorlds;

const FilterIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7H20M7 12H17M10 17H14" stroke="#3F394A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 5L15 3V19L9 21M9 5L3 7V21L9 19M9 5V19M15 3L21 5V19L15 17M15 3V17"
      stroke="#6D42D9"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ForestIcon = () => (
  <svg width="92" height="92" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <svg width="92" height="92" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <svg width="92" height="92" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const getHeroName = (fullName: string | null | undefined) => {
  if (!fullName) return 'Leo';
  const [firstName] = fullName.split(' ');
  return firstName || 'Leo';
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) => {
  return (
    <label className="block min-w-[150px]">
      <span className="mb-2 block text-[13px] font-medium text-[#3F394A]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[48px] w-full appearance-none rounded-[12px] border border-[#D9D0E8] bg-[#F7F4FD] px-4 text-[16px] text-[#3F394A] outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6A6277]">
          ⌄
        </span>
      </span>
    </label>
  );
};

const WorldCard = ({ world }: { world: WorldModuleCard }) => {
  const navigate = useNavigate();
  const Icon = iconByTone[world.tone];
  const tone = getCardToneStyles(world.tone);
  const progressPercent = Math.round((world.completedLevels / world.totalLevels) * 100);

  return (
    <button
      type="button"
      onClick={() => navigate(`${ROUTES.WORLDS}/${world.id}`)}
      className={`block w-full overflow-hidden rounded-[14px] border border-[#DCD4EA] bg-white text-left shadow-[0_8px_18px_rgba(124,58,237,0.06)] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(124,58,237,0.10)] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 ${tone.border}`}
      aria-label={`Ingresar a ${world.title}`}
    >
      <div className="px-4 pt-4">
        <span
          className={`inline-flex rounded-full bg-[#F7F4FD] px-4 py-1.5 text-[14px] font-medium ${tone.badge}`}
        >
          {world.difficultyLabel}
        </span>
      </div>

      <div
        className={`mx-4 mt-4 flex h-[160px] items-center justify-center rounded-[10px] border border-white/50 ${tone.surface}`}
      >
        <Icon />
      </div>

      <div className="px-5 pb-5 pt-4 text-center">
        <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-[#231F2D]">
          {world.title}
        </h3>
        <p className="mt-2 text-[15px] leading-[1.55] text-[#5E576E]">{world.description}</p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] font-medium text-[#7D7590]">
            <span>Progreso</span>
            <span>
              {world.completedLevels}/{world.totalLevels} niveles
            </span>
          </div>
          <div className="mt-2 h-[9px] overflow-hidden rounded-full bg-[#ECE6F6]">
            <div
              className={`h-full rounded-full ${tone.progress}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
};

type StudentWorldsModuleProps = {
  user: User | null;
};

export const StudentWorldsModule = ({ user }: StudentWorldsModuleProps) => {
  const [difficulty, setDifficulty] = useState<DifficultyKey>('easy');
  const [theme, setTheme] = useState<ThemeKey>('all');
  const [category, setCategory] = useState<CategoryKey>('beginners');

  const { worlds: fetchedWorlds } = useWorlds();
  const { progress } = useProgress(user?.id ?? null);

  const [worldStats, setWorldStats] = useState<Record<string, { total: number; completed: number }>>({});

  useEffect(() => {
    let mounted = true;

    const loadStats = async (): Promise<void> => {
      const list = (fetchedWorlds && fetchedWorlds.length > 0)
        ? fetchedWorlds
        : fallbackWorlds.map((w) => ({ id: w.id, name: w.title, description: w.description } as any));

      const entries = await Promise.all(
        list.map(async (w) => {
          const levelsResult = await worldsService.getLevelsByWorld(w.id);
          const levels = levelsResult.data ?? [];
          const levelIds = levels.map((l) => l.id);
          const completed = progress.filter((p) => levelIds.includes(p.levelId)).length;
          return { id: w.id, total: levels.length, completed };
        })
      );

      if (!mounted) return;

      const map: Record<string, { total: number; completed: number }> = {};
      for (const e of entries) map[e.id] = { total: e.total, completed: e.completed };
      setWorldStats(map);
    };

    void loadStats();

    return () => {
      mounted = false;
    };
  }, [fetchedWorlds, progress]);

  const dataWorlds = (fetchedWorlds && fetchedWorlds.length > 0)
    ? fetchedWorlds.map((w) => ({
        id: w.id,
        title: w.name,
        description: w.description,
        difficultyLabel: w.name ? 'Fácil' : 'Fácil',
        difficulty: (w as any).difficulty ?? 'easy',
        theme: 'logic',
        category: 'beginners',
        tone: 'forest' as const,
        completedLevels: worldStats[w.id]?.completed ?? 0,
        totalLevels: worldStats[w.id]?.total ?? 0,
      }))
    : fallbackWorlds;

  const filteredWorlds = useMemo(() => {
    return dataWorlds.filter((world) => {
      const matchesDifficulty = difficulty === 'all' || world.difficulty === difficulty;
      const matchesTheme = theme === 'all' || world.theme === theme;
      const matchesCategory = category === 'all' || world.category === category;

      return matchesDifficulty && matchesTheme && matchesCategory;
    });
  }, [category, difficulty, theme, dataWorlds]);

  return (
    <div className="px-0 py-0">
      <div className="grid grid-cols-1 gap-0 border-b border-[#E5DDF2] xl:grid-cols-[minmax(0,1fr)_minmax(620px,1.02fr)] xl:items-stretch">
        <section className="border-r border-[#DDD5EA] bg-white px-5 py-7 xl:px-6 xl:py-8">
          <div className="flex min-h-[156px] items-center gap-6 xl:gap-8">
            <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center rounded-full border-[4px] border-[#EFE7F8] bg-[radial-gradient(circle_at_top,_#5E626F_0%,_#24252E_95%)] text-[14px] font-medium text-white shadow-[0_12px_22px_rgba(45,40,55,0.16)]">
              Avatar
            </div>

            <div className="max-w-[520px] xl:max-w-[560px]">
              <h1 className="text-[46px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#231F2D] xl:text-[48px]">
                ¡HOLA! {getHeroName(user?.fullName)},
              </h1>
              <p className="mt-2 text-[18px] leading-[1.35] text-[#5E576E] xl:text-[20px]">
                bienvenidos de nuevo al código. ¿Listo para tu próxima expedición?
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#F6F3FA] px-1 py-3 xl:px-2 xl:py-4">
          <div className="flex h-[136px] w-full items-center justify-center rounded-[8px] border border-[#D6CCE7] bg-white text-[14px] font-medium text-[#9F95B4] xl:h-[144px]">
            Imagen Mundo
          </div>
        </section>
      </div>

      <section className="mx-6 mt-4 rounded-[18px] border border-[#DDD5EA] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(124,58,237,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-center gap-3 text-[#2F2938]">
            <FilterIcon />
            <span className="text-[18px] font-medium">Filtros</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <SelectField
              label="Dificultad"
              value={difficulty}
              onChange={(value) => setDifficulty(value as DifficultyKey)}
              options={[
                { value: 'easy', label: 'Fácil' },
                { value: 'medium', label: 'Intermedio' },
                { value: 'hard', label: 'Difícil' },
                { value: 'all', label: 'Todas' },
              ]}
            />
            <SelectField
              label="Tema"
              value={theme}
              onChange={(value) => setTheme(value as ThemeKey)}
              options={[
                { value: 'all', label: 'Todo' },
                { value: 'logic', label: 'Lógica' },
              ]}
            />
            <SelectField
              label="Categoría"
              value={category}
              onChange={(value) => setCategory(value as CategoryKey)}
              options={[
                { value: 'beginners', label: 'Principiantes' },
                { value: 'all', label: 'Todas' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="mx-6 mt-4 rounded-[18px] border border-[#DDD5EA] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(124,58,237,0.05)]">
        <div className="flex items-center gap-3 text-[#6D42D9]">
          <MapIcon />
          <h2 className="text-[24px] font-semibold tracking-[-0.04em]">Mundos</h2>
        </div>

        <div className="mt-4 h-px w-full bg-[#DDD5EA]" />

        <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-3">
          {filteredWorlds.map((world) => (
            <WorldCard key={world.id} world={world} />
          ))}
        </div>
      </section>
    </div>
  );
};
