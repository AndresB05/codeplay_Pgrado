import type { ReactNode } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAchievements } from '../../../hooks/useAchievements';
import { AchievementList } from '../AchievementList/AchievementList';
import { MonsteraLeaf, TropicalFlower } from '../../decor/JungleDecor';
import { trophyPercent, worldTrophyProgress } from '../../../lib/trophyProgress';

const TrophyIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path
      d="M8.5 4H15.5V9C15.5 10.93 13.93 12.5 12 12.5C10.07 12.5 8.5 10.93 8.5 9V4Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 5.5H6.3C5.3 5.5 4.5 6.3 4.5 7.3C4.5 9.5 6.3 11.3 8.5 11.3M15.5 5.5H17.7C18.7 5.5 19.5 6.3 19.5 7.3C19.5 9.5 17.7 11.3 15.5 11.3"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path d="M12 12.5V17M8.5 20H15.5" stroke="#2A1B45" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const CrownIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3.5 18L5.2 7.5L10.5 12L12 5L13.5 12L18.8 7.5L20.5 18H3.5Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M6 20.5H18" stroke="#2A1B45" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const MedalIcon = ({ color }: { color: string }) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 3H11L12 6L13 3H16L14 8H10L8 3Z"
      fill={color}
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="14" r="5.5" fill={color} stroke="#2A1B45" strokeWidth="2.2" />
    <path
      d="M12 11L12.9 12.9L15 13.2L13.5 14.7L13.9 16.8L12 15.8L10.1 16.8L10.5 14.7L9 13.2L11.1 12.9L12 11Z"
      fill="#FFF9EF"
    />
  </svg>
);

type BigTrophyCardProps = {
  title: string;
  description: string;
  progressLabel: string;
  progressValue: number;
  awardedXp: number;
  accent: keyof typeof bigCardStyles;
};


const bigCardStyles = {
  jungle: {
    gradient: 'linear-gradient(135deg, #7BE0A8 0%, #1F9D5B 100%)',
    bar: '#1F9D5B',
    chip: 'chip-leaf',
    medal: '#FFC93C',
  },
  grape: {
    gradient: 'linear-gradient(135deg, #A77BF3 0%, #7B3FE4 100%)',
    bar: '#7B3FE4',
    chip: 'chip-grape',
    medal: '#FFC93C',
  },
  sun: {
    gradient: 'linear-gradient(135deg, #FFE29A 0%, #FFC93C 100%)',
    bar: '#FFC93C',
    chip: 'chip-sun',
    medal: '#FF8A3D',
  },
  /* El tercero entra con el paso 22: los mundos son tres, y las tarjetas también. */
  sky: {
    gradient: 'linear-gradient(135deg, #8FD8F7 0%, #2BA7DD 100%)',
    bar: '#2BA7DD',
    chip: 'chip-sky',
    medal: '#FFC93C',
  },
};

/*
 * UNA TARJETA GRANDE POR MUNDO, en el orden del catálogo. Las claves las fija la
 * migración 0036 derivando del `sort_order` del mundo, así que esta lista y
 * aquélla se leen juntas.
 */
const WORLD_TROPHIES: { key: string; order: number; accent: keyof typeof bigCardStyles }[] = [
  { key: 'perfect_world_1', order: 1, accent: 'jungle' },
  { key: 'perfect_world_2', order: 2, accent: 'grape' },
  { key: 'perfect_world_3', order: 3, accent: 'sky' },
];

/* Los de mundo ya tienen su tarjeta grande: repetirlos abajo los contaba dos veces. */
const WORLD_TROPHY_KEYS = new Set(WORLD_TROPHIES.map((trophy) => trophy.key));


const BigTrophyCard = ({
  title,
  description,
  progressLabel,
  progressValue,
  awardedXp,
  accent,
}: BigTrophyCardProps) => {
  const style = bigCardStyles[accent];

  return (
    <article className="card overflow-hidden">
      <div
        className="relative flex items-center gap-4 border-b-[3px] border-ink px-5 py-4"
        style={{ background: style.gradient }}
      >
        <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/25" />

        <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] border-[3px] border-ink bg-white">
          <MedalIcon color={style.medal} />
        </span>

        <div className="relative min-w-0">
          <h3 className="font-display text-[22px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
            {title}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px]">
        <div className="px-5 py-5">
          <p className="max-w-[380px] text-[15px] font-semibold leading-[1.6] text-ink-soft">
            {description}
          </p>

          <div className="mt-5 h-[14px] w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
            <div
              className="h-full rounded-full"
              style={{ width: `${progressValue}%`, background: style.bar }}
            />
          </div>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <span className="chip chip-sun">+{awardedXp} XP</span>
            <span className={`chip ${style.chip}`}>{progressLabel}</span>
          </div>
        </div>

        <div className="border-t-[3px] border-line px-5 py-5 lg:border-l-[3px] lg:border-t-0">
          {/* Hueco reservado para la ilustración del logro. */}
          <div className="flex h-[114px] w-full items-center justify-center rounded-[18px] border-[3px] border-dashed border-line bg-cream font-display text-[14px] text-ink-faint">
            Imagen logro
          </div>
        </div>
      </div>
    </article>
  );
};

const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-sun-soft">
      {icon}
    </span>
    <h2 className="title-lg">{title}</h2>
  </div>
);

export const StudentTrophiesModule = () => {
  const { user } = useAuth();
  const {
    achievements,
    loading: achievementsLoading,
    error: achievementsError,
  } = useAchievements(user?.id ?? null);

  /* Las tarjetas grandes buscan su logro por clave, no por posición. */
  const byKey = new Map(achievements.map((achievement) => [achievement.key, achievement]));
  const regularAchievements = achievements.filter(
    (achievement) => !WORLD_TROPHY_KEYS.has(achievement.key)
  );

  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden px-5 py-5">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-sun-soft" />
        <MonsteraLeaf
          size={88}
          className="pointer-events-none absolute -left-6 -bottom-8 rotate-[26deg] opacity-80"
        />

        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-sun shadow-[0_4px_0_rgba(42,27,69,0.2)]">
            <TrophyIcon />
          </span>

          <div>
            <h1 className="title-xl">Sala de Trofeos</h1>
            <p className="subtitle mt-1">
              Todo lo que has conquistado en la selva del código, en un solo lugar.
            </p>
          </div>

          <span className="chip chip-leaf ml-auto">
            <TropicalFlower size={16} />
            Sigue coleccionando
          </span>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<CrownIcon />} title="Grandes trofeos" />

        <p className="subtitle mt-2">
          Uno por mundo, y sólo con los tres niveles al 100.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {WORLD_TROPHIES.map((trophy) => {
            const achievement = byKey.get(trophy.key);

            if (!achievement) {
              return null;
            }

            const unlocked = achievement.unlockedAt !== null;
            const progress = worldTrophyProgress(achievements, trophy.order);

            return (
              <BigTrophyCard
                key={trophy.key}
                title={achievement.title}
                description={achievement.description}
                /*
                 * El recuento va SIEMPRE, también al desbloquearlo: «3/3» dice
                 * de qué se ganó el trofeo, y «Desbloqueado» a secas deja al
                 * niño sin saber cuántos niveles tenía este mundo.
                 */
                progressLabel={
                  unlocked
                    ? `Desbloqueado · ${progress.done}/${progress.total}`
                    : `${progress.done}/${progress.total} niveles al 100`
                }
                progressValue={unlocked ? 100 : trophyPercent(progress)}
                awardedXp={achievement.awardedXp}
                accent={trophy.accent}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-8 pb-4">
        <SectionTitle icon={<CrownIcon />} title="Todos los logros" />

        <div className="mt-5">
          {achievementsLoading ? (
            <p className="card px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
              Cargando logros...
            </p>
          ) : null}

          {achievementsError ? (
            <p className="rounded-[20px] border-2 border-coral-dark bg-coral-soft px-5 py-4 text-[15px] font-bold text-coral-dark">
              {achievementsError.message}
            </p>
          ) : null}

          {!achievementsLoading && !achievementsError ? (
            <AchievementList achievements={regularAchievements} />
          ) : null}
        </div>
      </section>
    </div>
  );
};
