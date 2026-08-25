import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { User } from '../../../types/user.types';
import {
  type CategoryKey,
  type DifficultyKey,
  type DifficultyLabel,
  getCardToneStyles,
  studentWorlds,
  type ThemeKey,
  type WorldModuleCard,
} from './worlds/worldsData';
import { useWorlds } from '../../../hooks/useWorlds';
import { useProgress } from '../../../hooks/useProgress';
import { worldsService } from '../../../services/worlds.service';
import { MonsteraLeaf, PalmFrond, TropicalFlower } from '../../decor/JungleDecor';

const fallbackWorlds: WorldModuleCard[] = studentWorlds;

const DIFFICULTY_LABELS: Record<Exclude<DifficultyKey, 'all'>, DifficultyLabel> = {
  easy: 'Fácil',
  medium: 'Intermedio',
  hard: 'Difícil',
};

const FilterIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M4 7H20M7 12H17M10 17H14" stroke="#2A1B45" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const MapIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 5L15 3V19L9 21M9 5L3 7V21L9 19M9 5V19M15 3L21 5V19L15 17M15 3V17"
      stroke="#2A1B45"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Icono del bioma selva: la hoja de la costilla de Adán. */
const ForestIcon = () => <MonsteraLeaf size={72} color="#FFF9EF" />;

const VolcanoIcon = () => (
  <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
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
  <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
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
    <label className="block min-w-[160px]">
      <span className="field-label mb-2 block">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field appearance-none pr-10 font-display"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-display text-[18px] text-ink-soft">
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
  const progressPercent =
    world.totalLevels > 0 ? Math.round((world.completedLevels / world.totalLevels) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => navigate(`${ROUTES.WORLDS}/${world.id}`)}
      className="card block w-full overflow-hidden text-left transition-transform duration-100 hover:-translate-y-1 active:translate-y-0"
      aria-label={`Ingresar a ${world.title}`}
    >
      <div
        className="relative flex h-[168px] items-center justify-center border-b-[3px] border-ink"
        style={{ background: tone.gradient }}
      >
        <span className="pointer-events-none absolute -right-5 -top-7 h-24 w-24 rounded-full bg-white/25" />
        <span className="pointer-events-none absolute left-6 bottom-4 h-10 w-10 rounded-full bg-white/20" />

        <Icon />

        <span className="absolute left-4 top-4 rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-[13px] text-ink">
          {world.difficultyLabel}
        </span>
      </div>

      <div className="px-5 pb-5 pt-4 text-center">
        <h3 className="font-display text-[22px] leading-tight text-ink">{world.title}</h3>
        <p className="mt-2 text-[15px] font-semibold leading-[1.6] text-ink-soft">
          {world.description}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-[0.04em] text-ink-faint">
            <span>Progreso</span>
            <span>
              {world.completedLevels}/{world.totalLevels} niveles
            </span>
          </div>

          <div className="mt-2 h-[14px] w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPercent}%`, background: tone.color }}
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

  const [worldStats, setWorldStats] = useState<
    Record<string, { total: number; completed: number }>
  >({});

  useEffect(() => {
    let mounted = true;

    const loadStats = async (): Promise<void> => {
      const list =
        fetchedWorlds && fetchedWorlds.length > 0
          ? fetchedWorlds.map((world) => ({ id: world.id }))
          : fallbackWorlds.map((world) => ({ id: world.id }));

      const entries = await Promise.all(
        list.map(async (world) => {
          const levelsResult = await worldsService.getLevelsByWorld(world.id);
          const levels = levelsResult.data ?? [];
          const levelIds = levels.map((level) => level.id);
          const completed = progress.filter((item) => levelIds.includes(item.levelId)).length;
          return { id: world.id, total: levels.length, completed };
        })
      );

      if (!mounted) return;

      const map: Record<string, { total: number; completed: number }> = {};
      for (const entry of entries)
        map[entry.id] = { total: entry.total, completed: entry.completed };
      setWorldStats(map);
    };

    void loadStats();

    return () => {
      mounted = false;
    };
  }, [fetchedWorlds, progress]);

  const dataWorlds: WorldModuleCard[] = useMemo(() => {
    if (!fetchedWorlds || fetchedWorlds.length === 0) {
      return fallbackWorlds;
    }

    const tones: WorldModuleCard['tone'][] = ['forest', 'volcano', 'ocean'];

    return fetchedWorlds.map((world, index) => {
      const worldDifficulty: Exclude<DifficultyKey, 'all'> = 'easy';

      return {
        id: world.id,
        title: world.name,
        description: world.description,
        difficultyLabel: DIFFICULTY_LABELS[worldDifficulty],
        difficulty: worldDifficulty,
        theme: 'logic',
        category: 'beginners',
        tone: tones[index % tones.length],
        completedLevels: worldStats[world.id]?.completed ?? 0,
        totalLevels: worldStats[world.id]?.total ?? 0,
      };
    });
  }, [fetchedWorlds, worldStats]);

  const filteredWorlds = useMemo(() => {
    return dataWorlds.filter((world) => {
      const matchesDifficulty = difficulty === 'all' || world.difficulty === difficulty;
      const matchesTheme = theme === 'all' || world.theme === theme;
      const matchesCategory = category === 'all' || world.category === category;

      return matchesDifficulty && matchesTheme && matchesCategory;
    });
  }, [category, difficulty, theme, dataWorlds]);

  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden px-5 py-5">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-jungle-soft" />
        <PalmFrond
          size={96}
          className="pointer-events-none absolute -left-6 -bottom-8 rotate-[18deg] opacity-70"
        />

        <div className="relative grid grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-wrap items-center gap-6">
            {/* Hueco reservado para el avatar de la mascota. */}
            <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center rounded-full border-[3px] border-dashed border-line bg-cream font-display text-[14px] text-ink-faint">
              Avatar
            </div>

            <div className="max-w-[560px]">
              <span className="chip chip-leaf">
                <TropicalFlower size={16} />
                Expedición del día
              </span>

              <h1 className="title-xl mt-3">¡HOLA, {getHeroName(user?.fullName)}!</h1>
              <p className="subtitle mt-1">
                Bienvenido de nuevo al código. ¿Listo para tu próxima expedición por la selva?
              </p>
            </div>
          </div>

          {/* Hueco reservado para la ilustración del mundo. */}
          <div className="flex h-[136px] w-full items-center justify-center rounded-[22px] border-[3px] border-dashed border-line bg-cream font-display text-[14px] text-ink-faint xl:h-[144px]">
            Imagen Mundo
          </div>
        </div>
      </section>

      <section className="card mt-6 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-sun-soft">
              <FilterIcon />
            </span>
            <h2 className="title-lg">Filtros</h2>
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

      <section className="mt-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-grape-soft">
            <MapIcon />
          </span>
          <h2 className="title-lg">Mundos</h2>
        </div>

        {filteredWorlds.length === 0 ? (
          <p className="card mt-4 px-5 py-12 text-center text-[16px] font-semibold text-ink-faint">
            Ningún mundo coincide con estos filtros. Prueba con otra dificultad.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredWorlds.map((world) => (
              <WorldCard key={world.id} world={world} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
