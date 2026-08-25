import type { ReactNode } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAchievements } from '../../../hooks/useAchievements';
import { AchievementList } from '../AchievementList/AchievementList';
import { MonsteraLeaf, TropicalFlower } from '../../decor/JungleDecor';

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

const BlocksIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="4"
      width="6.5"
      height="6.5"
      rx="2"
      fill="#D6F7F3"
      stroke="#2A1B45"
      strokeWidth="2.2"
    />
    <rect
      x="13.5"
      y="4"
      width="6.5"
      height="6.5"
      rx="2"
      fill="#FFF4D6"
      stroke="#2A1B45"
      strokeWidth="2.2"
    />
    <rect
      x="8.75"
      y="13.5"
      width="6.5"
      height="6.5"
      rx="2"
      fill="#F0E6FF"
      stroke="#2A1B45"
      strokeWidth="2.2"
    />
  </svg>
);

const InfinityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path
      d="M9.5 9.5C8.2 8.2 6 8.2 4.7 9.5C3.4 10.8 3.4 13 4.7 14.3C6 15.6 8.2 15.6 9.5 14.3L14.5 9.7C15.8 8.4 18 8.4 19.3 9.7C20.6 11 20.6 13.2 19.3 14.5C18 15.8 15.8 15.8 14.5 14.5L9.5 9.5Z"
      stroke="#2A1B45"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type BigTrophyCardProps = {
  title: string;
  description: string;
  progressLabel: string;
  progressValue: number;
  accent: 'grape' | 'sun';
};

type LogicCardProps = {
  title: string;
  description: string;
  progressLabel: string;
  progressValue: number;
  accent: 'jungle' | 'muted';
  badge?: string;
  locked?: boolean;
  icon: 'blocks' | 'infinity';
};

const bigCardStyles = {
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
};

const logicCardStyles = {
  jungle: {
    bubble: 'bg-jungle-soft',
    bar: '#1F9D5B',
    chip: 'chip-leaf',
  },
  muted: {
    bubble: 'bg-cream',
    bar: '#8B82A6',
    chip: 'chip-grape',
  },
};

const BigTrophyCard = ({
  title,
  description,
  progressLabel,
  progressValue,
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

          <div className="mt-3 flex justify-end">
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

const LogicCard = ({
  title,
  description,
  progressLabel,
  progressValue,
  accent,
  badge,
  locked,
  icon,
}: LogicCardProps) => {
  const style = logicCardStyles[accent];

  return (
    <article className={`card px-5 py-5 ${locked ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-[18px] border-[3px] border-ink ${style.bubble}`}
        >
          {icon === 'blocks' ? <BlocksIcon /> : <InfinityIcon />}
        </span>

        {badge ? <span className={`chip ${style.chip}`}>{badge}</span> : null}
        {locked ? <span className="chip chip-grape">🔒 Bloqueado</span> : null}
      </div>

      <h3 className="mt-4 font-display text-[19px] text-ink">{title}</h3>
      <p className="mt-1 text-[15px] font-semibold leading-[1.6] text-ink-soft">{description}</p>

      <div className="mt-5 h-[12px] w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
        <div
          className="h-full rounded-full"
          style={{ width: `${progressValue}%`, background: style.bar }}
        />
      </div>

      <div className="mt-2 text-[13px] font-bold uppercase tracking-[0.04em] text-ink-faint">
        {progressLabel}
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

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BigTrophyCard
            title="Maestro Explorador"
            description="Completa todos los niveles del Mundo 1 sin cometer errores de sintaxis."
            progressLabel="100% Completado"
            progressValue={100}
            accent="grape"
          />

          <BigTrophyCard
            title="Cazador de Bugs"
            description="Encuentra y corrige 50 errores lógicos en los desafíos de clase."
            progressLabel="Desbloqueado"
            progressValue={100}
            accent="sun"
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<BlocksIcon />} title="Lógica" />

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LogicCard
            title="Arquitecto de Variables"
            description="Crea 10 variables correctamente nombradas y utilizadas."
            progressLabel="4/10"
            progressValue={40}
            accent="jungle"
            badge="En progreso"
            icon="blocks"
          />

          <LogicCard
            title="Señor de los Bucles"
            description="Utiliza bucles de forma eficiente en 3 mundos distintos."
            progressLabel="0/3 Mundos"
            progressValue={0}
            accent="muted"
            locked
            icon="infinity"
          />
        </div>
      </section>

      <section className="mt-8 pb-4">
        <SectionTitle icon={<CrownIcon />} title="Logros" />

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
            <AchievementList achievements={achievements} />
          ) : null}
        </div>
      </section>
    </div>
  );
};
