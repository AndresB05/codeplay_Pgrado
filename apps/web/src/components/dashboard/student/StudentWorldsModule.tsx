import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { FALLBACK_STUDENT_NAME } from '../../../services/classrooms.service';
import type { User } from '../../../types/user.types';
import { type DifficultyLabel, getCardToneStyles, type WorldModuleCard } from './worlds/worldsData';
import { useWorlds } from '../../../hooks/useWorlds';
import { AssignedMissionsPanel } from '../shared/AssignedMissionsPanel';
import { useWorldLocks } from '../../../hooks/useWorldLocks';
import { LockIcon } from './LockIcon';
import { useProgress } from '../../../hooks/useProgress';
import { worldsService } from '../../../services/worlds.service';
import { MonsteraLeaf } from '../../decor/JungleDecor';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import world1 from '../../../assets/brand/world-1-card.webp';
import world2 from '../../../assets/brand/world-2-card.webp';
import world3 from '../../../assets/brand/world-3-card.webp';
import worldBannerChild from '../../../assets/brand/world-banner-child.webp';
import stampWorlds from '../../../assets/brand/settings-stamp-worlds.webp';

/*
 * La dificultad sale del orden: cada mundo pide lo del anterior y algo más, y
 * el tercero ya limita los pasos. Un cuarto mundo se quedaría en «Difícil».
 */
const DIFFICULTY_BY_ORDER: DifficultyLabel[] = ['Fácil', 'Intermedio', 'Difícil'];

const ALL = 'all';

const SHOW_FILTERS = false;

/*
 * Las ilustraciones van por orden, como la dificultad, con el mismo encuadre que
 * en la portada: la cabecera recorta una franja baja y el leopardo tiene que
 * quedar dentro. Un mundo sin ilustración conserva su degradado e icono.
 *
 * Son las variantes `-card`, de 1400 px: la tarjeta se pinta a 701 px como
 * mucho hasta 1920 de ventana, y 1400 es el doble. Los originales de 2000 px
 * siguen siendo los de la portada, que llega a pintarlos a 1127.
 */
const WORLD_IMAGES: { src: string; position: string }[] = [
  { src: world1, position: 'object-[35%_55%]' },
  { src: world2, position: 'object-[50%_22%]' },
  { src: world3, position: 'object-[50%_60%]' },
];

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
  if (!fullName) return FALLBACK_STUDENT_NAME;
  const [firstName] = fullName.split(' ');
  return firstName || FALLBACK_STUDENT_NAME;
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
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-soft"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </label>
  );
};

const LEVEL_STAMP_TILTS = ['-rotate-[8deg]', 'rotate-[6deg]', '-rotate-[4deg]'];

/*
 * El sello es morado; girándole el tono, cada mundo lo lleva en su color, el de
 * la barra de progreso que había antes: verde, naranja y azul.
 */
const STAMP_HUE: Record<WorldModuleCard['tone'], string> = {
  forest: 'hue-rotate(-150deg)',
  volcano: 'hue-rotate(100deg)',
  ocean: 'hue-rotate(-80deg)',
};

const WorldCard = ({ world }: { world: WorldModuleCard }) => {
  const navigate = useNavigate();
  const Icon = iconByTone[world.tone];
  const tone = getCardToneStyles(world.tone);
  const isLocked = world.lockedBy !== null;

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => navigate(`${ROUTES.WORLDS}/${world.id}`)}
      className={`passport-page flex w-full flex-col text-left transition-transform duration-100 [border-width:30px] ${
        isLocked ? 'cursor-not-allowed grayscale' : 'hover:-translate-y-1 active:translate-y-0'
      }`}
      aria-label={
        isLocked ? `${world.title}: primero supera ${world.lockedBy}` : `Ingresar a ${world.title}`
      }
    >
      {/*
       * `flex-col` no es de adorno: un `<button>` que la rejilla estira centra su
       * contenido en vertical, y la tarjeta de texto más corto enseñaba una
       * franja blanca encima de la cabecera.
       */}
      {/* Una página del pasaporte: la ilustración ocupa el ancho de arriba, hasta la línea oscura. */}
      <div
        className="relative -mx-3 -mt-3 flex h-[170px] items-center justify-center overflow-hidden rounded-t-[10px]"
        style={{ background: tone.gradient }}
      >
        {world.image ? (
          <img
            src={world.image.src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${world.image.position}`}
          />
        ) : (
          <>
            <span className="pointer-events-none absolute -right-5 -top-7 h-24 w-24 rounded-full bg-white/25" />
            <span className="pointer-events-none absolute bottom-4 left-6 h-10 w-10 rounded-full bg-white/20" />

            <Icon />
          </>
        )}

        <span className="passport-paper absolute left-3 top-3 -rotate-6 rounded-md border-[3px] border-double border-jungle-dark px-2.5 font-map text-[17px] text-jungle-dark">
          {world.difficultyLabel}
        </span>

        {isLocked ? (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-[13px] text-ink">
            <LockIcon />
            Bloqueado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3.5 text-center">
        <h3 className="title-lg text-[24px]">{world.title}</h3>
        <p className="subtitle mt-1 text-[15px] leading-[1.45]">{world.description}</p>

        {isLocked ? (
          <p className="subtitle mt-2 text-[15px]">Primero supera {world.lockedBy}.</p>
        ) : null}

        {/* Una casilla por nivel, que se sella al superarlo, como la tira de misiones. */}
        <div className="mt-auto flex items-center justify-center gap-2.5 pt-4">
          {Array.from({ length: world.totalLevels }, (_, index) =>
            index < world.completedLevels ? (
              <img
                key={index}
                src={stampWorlds}
                alt=""
                className={`h-10 w-10 ${LEVEL_STAMP_TILTS[index % LEVEL_STAMP_TILTS.length]}`}
                style={{ filter: STAMP_HUE[world.tone] }}
              />
            ) : (
              <span
                key={index}
                aria-hidden
                className="h-10 w-10 rounded-full border-[3px] border-dashed border-sepia-soft"
              />
            )
          )}
          <span className="ml-1.5 font-display text-[15px] text-sepia">
            {world.completedLevels} de {world.totalLevels} niveles
          </span>
        </div>
      </div>
    </button>
  );
};

type StudentWorldsModuleProps = {
  user: User | null;
};

export const StudentWorldsModule = ({ user }: StudentWorldsModuleProps) => {
  /* Arrancan en «Todas»: con otro valor, el niño entraría sin ver parte de sus mundos. */
  const [difficulty, setDifficulty] = useState<string>(ALL);
  const [theme, setTheme] = useState<string>(ALL);
  const { worlds: fetchedWorlds, loading: worldsLoading, error: worldsError } = useWorlds();
  const { progress } = useProgress(user?.id ?? null);
  const { blockerOf } = useWorldLocks(user?.id ?? null);

  const [worldStats, setWorldStats] = useState<
    Record<string, { total: number; completed: number }>
  >({});

  useEffect(() => {
    let mounted = true;

    const loadStats = async (): Promise<void> => {
      const list = (fetchedWorlds ?? []).map((world) => ({ id: world.id }));

      if (list.length === 0) {
        return;
      }

      const entries = await Promise.all(
        list.map(async (world) => {
          const levelsResult = await worldsService.getLevelsByWorld(world.id);
          const levels = levelsResult.data ?? [];
          const levelIds = levels.map((level) => level.id);

          /*
           * SUPERADOS, no «con fila de progreso». Desde que el J9 escribe
           * `in_progress` al fallar hay filas de niveles que el niño no ha
           * resuelto, y sin este filtro cada intento fallido subiría el
           * contador del mundo. Es el mismo criterio que la lista de niveles
           * de dentro del mundo, que ya lo aplicaba.
           */
          const completed = progress.filter(
            (item) => levelIds.includes(item.levelId) && item.completionStatus === 'completed'
          ).length;
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
    const tones: WorldModuleCard['tone'][] = ['forest', 'volcano', 'ocean'];

    return fetchedWorlds.map((world, index) => {
      return {
        id: world.id,
        title: world.name,
        description: world.description,
        difficultyLabel: DIFFICULTY_BY_ORDER[Math.min(index, DIFFICULTY_BY_ORDER.length - 1)],
        theme: world.regionLabel,
        tone: tones[index % tones.length],
        image: WORLD_IMAGES[index] ?? null,
        completedLevels: worldStats[world.id]?.completed ?? 0,
        totalLevels: worldStats[world.id]?.total ?? 0,
        lockedBy: blockerOf(world.id)?.name ?? null,
      };
    });
  }, [fetchedWorlds, worldStats, blockerOf]);

  /* Los temas salen de los mundos que hay, para no ofrecer uno que deje la lista vacía. */
  const themeOptions = useMemo(
    () => [...new Set(dataWorlds.flatMap((world) => (world.theme ? [world.theme] : [])))],
    [dataWorlds]
  );

  const filteredWorlds = useMemo(
    () =>
      dataWorlds.filter(
        (world) =>
          (difficulty === ALL || world.difficultyLabel === difficulty) &&
          (theme === ALL || world.theme === theme)
      ),
    [dataWorlds, difficulty, theme]
  );

  return (
    <div className="px-5 py-5">
      {/*
       * El saludo, en la página del pasaporte de «Mi cuenta». La ilustración va
       * por dentro de la línea oscura del borde: los márgenes negativos la
       * llevan hasta ella sin tapar las costuras.
       */}
      <section className="passport-page relative">
        <div className="pointer-events-none absolute -bottom-4 -right-4 -top-4 hidden w-[40%] overflow-hidden rounded-r-[10px] lg:block">
          <img
            src={worldBannerChild}
            alt=""
            className="h-full w-full object-cover object-[55%_50%]"
          />
          <div className="passport-art-fade absolute inset-y-0 left-0 w-[55%]" />
        </div>

        <div className="relative flex flex-wrap items-center gap-6 lg:flex-nowrap lg:pr-[44%]">
          <img
            src={pickMascotAvatar(user?.id, user?.fullName, user?.avatarKey)}
            alt=""
            className="h-[110px] w-[110px] shrink-0 rounded-full border-[3px] border-ink bg-cream object-cover"
          />

          <div className="max-w-[560px]">
            <h1 className="title-xl">¡HOLA, {getHeroName(user?.fullName)}!</h1>
            <p className="subtitle mt-1">
              Bienvenido de nuevo al código. ¿Listo para tu próxima expedición por la selva?
            </p>
          </div>
        </div>

        {/* En pantallas angostas no hay espacio al lado: la ilustración baja debajo del saludo. */}
        <img
          src={worldBannerChild}
          alt=""
          className="relative mt-6 h-[160px] w-full rounded-[14px] object-cover lg:hidden"
        />
      </section>

      <AssignedMissionsPanel hideCompleted />

      {/*
       * Apagados mientras haya tres mundos: cada filtro deja una sola tarjeta, la
       * que ya lleva esa dificultad en la esquina. Vuelven cuando haya más.
       */}
      {SHOW_FILTERS ? (
        <section className="card mt-6 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                onChange={setDifficulty}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...DIFFICULTY_BY_ORDER.map((label) => ({ value: label, label })),
                ]}
              />
              <SelectField
                label="Tema"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...themeOptions.map((label) => ({ value: label, label })),
                ]}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 pb-4">
        <div className="classroom-cartouche flex w-fit items-center gap-3 px-[30px] py-1.5">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-sepia">
            <MapIcon />
          </span>
          <h2 className="map-title font-display text-[30px] text-sepia">Mundos</h2>
        </div>

        {/*
         * Sin repliegue de maqueta: si la lectura falla se dice, en vez de
         * enseñar mundos inventados con un progreso que el niño no hizo.
         */}
        {worldsLoading ? (
          <p className="card mt-4 px-5 py-12 text-center text-[16px] font-semibold text-ink-faint">
            Cargando mundos...
          </p>
        ) : worldsError ? (
          <p className="mt-4 rounded-[20px] border-2 border-coral-dark bg-coral-soft px-5 py-4 text-[15px] font-bold text-coral-dark">
            No pudimos cargar los mundos. Recarga la página para intentarlo de nuevo.
          </p>
        ) : dataWorlds.length === 0 ? (
          <p className="card mt-4 px-5 py-12 text-center text-[16px] font-semibold text-ink-faint">
            Todavía no hay mundos disponibles.
          </p>
        ) : filteredWorlds.length === 0 ? (
          <p className="card mt-4 px-5 py-12 text-center text-[16px] font-semibold text-ink-faint">
            Ningún mundo coincide con estos filtros. Prueba con otra combinación.
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
