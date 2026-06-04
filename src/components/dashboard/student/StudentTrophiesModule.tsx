const HeaderBadgeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="4" fill="#8B5CF6" fillOpacity="0.18" />
    <path
      d="M8.5 8H15.5V11.5C15.5 13.43 13.93 15 12 15C10.07 15 8.5 13.43 8.5 11.5V8Z"
      stroke="#7C3AED"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M10 17H14" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CrownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.5 18L5.2 7.5L10.5 12L12 5L13.5 12L18.8 7.5L20.5 18H3.5Z"
      stroke="#F59E0B"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M6 20.5H18" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LogicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" fill="#8B5CF6" />
  </svg>
);

const MedalIcon = ({ color }: { color: string }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3H11L12 6L13 3H16L14 8H10L8 3Z" fill={color} />
    <circle cx="12" cy="14" r="5" stroke={color} strokeWidth="2" />
    <path
      d="M12 11.4L12.8 13.1L14.7 13.3L13.3 14.6L13.7 16.4L12 15.5L10.3 16.4L10.7 14.6L9.3 13.3L11.2 13.1L12 11.4Z"
      fill={color}
    />
  </svg>
);

const BlocksIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="6" height="6" rx="1.2" stroke="#9A8FBB" strokeWidth="1.6" />
    <rect x="14" y="4" width="6" height="6" rx="1.2" stroke="#9A8FBB" strokeWidth="1.6" />
    <rect x="9" y="14" width="6" height="6" rx="1.2" stroke="#9A8FBB" strokeWidth="1.6" />
    <path d="M10 7H14M17 10V14M12 10V14" stroke="#9A8FBB" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const InfinityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.5 9.5C8.2 8.2 6 8.2 4.7 9.5C3.4 10.8 3.4 13 4.7 14.3C6 15.6 8.2 15.6 9.5 14.3L14.5 9.7C15.8 8.4 18 8.4 19.3 9.7C20.6 11 20.6 13.2 19.3 14.5C18 15.8 15.8 15.8 14.5 14.5L9.5 9.5Z"
      stroke="#C9C3D7"
      strokeWidth="1.8"
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
  accent: 'purple' | 'gold';
};

type LogicCardProps = {
  title: string;
  description: string;
  progressLabel: string;
  progressValue: number;
  accent: 'teal' | 'gray';
  badge?: string;
  locked?: boolean;
  icon: 'blocks' | 'infinity';
};

const bigCardStyles = {
  purple: {
    line: 'border-t-[#8B5CF6]',
    progress: 'bg-[#8B5CF6]',
    text: 'text-[#6D42D9]',
    gradient: 'bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF8FF_100%)]',
    corner: 'bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_52%)]',
    iconBg: 'bg-[#F1EBFF]',
    iconColor: '#A97000',
  },
  gold: {
    line: 'border-t-[#F4B547]',
    progress: 'bg-[#F4B547]',
    text: 'text-[#A46906]',
    gradient: 'bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFAF0_100%)]',
    corner: 'bg-[radial-gradient(circle_at_top_right,rgba(244,181,71,0.18),transparent_52%)]',
    iconBg: 'bg-[#F8F2FF]',
    iconColor: '#6D42D9',
  },
};

const logicCardStyles = {
  teal: {
    line: 'border-l-[#29A39A]',
    progress: 'bg-[#29A39A]',
    badge: 'bg-[#F1EEFA] text-[#8E83A8]',
    gradient: 'bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF8FF_100%)]',
    opacity: 'opacity-100',
  },
  gray: {
    line: 'border-l-[#C7C2D5]',
    progress: 'bg-[#D9D4E6]',
    badge: 'bg-[#F4F2F8] text-[#A6A0B6]',
    gradient: 'bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFAFD_100%)]',
    opacity: 'opacity-45',
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
    <article
      className={`relative overflow-hidden rounded-[18px] border border-[#E3DCEE] border-t-[3px] ${style.line} ${style.gradient} shadow-[0_10px_22px_rgba(124,58,237,0.05)]`}
    >
      <div className={`pointer-events-none absolute inset-0 ${style.corner}`} />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_240px]">
        <div className="px-5 pb-4 pt-5 lg:px-6 lg:pb-5 lg:pt-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
            >
              <MedalIcon color={style.iconColor} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#231F2D]">
                {title}
              </h3>
              <p className="mt-1 max-w-[360px] text-[14px] leading-[1.6] text-[#5E576E]">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-5 h-px w-full bg-[#EEE7F6]" />

          <div className="mt-5 h-[8px] overflow-hidden rounded-full bg-[#ECE6F6]">
            <div
              className={`h-full rounded-full ${style.progress}`}
              style={{ width: `${progressValue}%` }}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <span
              className={`rounded-[6px] bg-[#F3EEFD] px-4 py-1.5 text-[12px] font-semibold ${style.text}`}
            >
              {progressLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-[#E3DCEE] px-5 py-5 lg:border-l lg:border-t-0 lg:px-5">
          <div className="flex h-[114px] w-full max-w-[220px] items-center justify-center rounded-[10px] border border-[#D7CCE8] bg-white text-[14px] font-medium text-[#A195B7]">
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
    <article
      className={`overflow-hidden rounded-[14px] border border-[#E3DCEE] border-l-[3px] ${style.line} ${style.gradient} shadow-[0_8px_18px_rgba(124,58,237,0.04)] ${style.opacity}`}
    >
      <div className="px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#DAD3E8] bg-[#FAF8FE]">
            {icon === 'blocks' ? <BlocksIcon /> : <InfinityIcon />}
          </div>

          {badge ? (
            <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${style.badge}`}>
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#231F2D]">
            {title}{' '}
            {locked ? (
              <span className="text-[13px] font-medium text-[#8E88A0]">🔒 Bloqueado</span>
            ) : null}
          </h3>
          <p className="mt-1 text-[13px] leading-[1.55] text-[#6A637A]">{description}</p>
        </div>

        <div className="mt-5 h-[6px] overflow-hidden rounded-full bg-[#ECE6F6]">
          <div
            className={`h-full rounded-full ${style.progress}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>

        <div className="mt-2 text-[11px] font-medium text-[#7D7590]">{progressLabel}</div>
      </div>
    </article>
  );
};

import { useAuth } from '../../../hooks/useAuth';
import { useAchievements } from '../../../hooks/useAchievements';
import { AchievementList } from '../AchievementList/AchievementList';

export const StudentTrophiesModule = () => {
  const { user } = useAuth();
  const { achievements, loading: achievementsLoading, error: achievementsError } = useAchievements(
    user?.id ?? null
  );
  return (
    <div className="px-4 py-4">
      <section className="border-b border-[#E5DDF2] px-2 pb-3">
        <div className="flex items-center gap-3 text-[#231F2D]">
          <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[#EFE9FD]">
            <HeaderBadgeIcon />
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#231F2D]">
            Sala de Trofeos
          </h1>
        </div>
      </section>

      <section className="mt-6 px-2">
        <div className="flex items-center gap-2 text-[#231F2D]">
          <CrownIcon />
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Grandes trofeos</h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BigTrophyCard
            title="Maestro Explorador"
            description="Completa todos los niveles del Mundo 1 sin cometer errores de sintaxis."
            progressLabel="100% Completado"
            progressValue={100}
            accent="purple"
          />

          <BigTrophyCard
            title="Cazador de Bugs"
            description="Encuentra y corrige 50 errores lógicos en los desafíos de clase."
            progressLabel="Desbloqueado"
            progressValue={100}
            accent="gold"
          />
        </div>
      </section>

      <section className="mt-8 px-2">
        <div className="flex items-center gap-2 text-[#231F2D]">
          <LogicIcon />
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Lógica</h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LogicCard
            title="Arquitecto de Variables"
            description="Crea 10 variables correctamente nombradas y utilizadas."
            progressLabel="4/10"
            progressValue={40}
            accent="teal"
            badge="En progreso"
            icon="blocks"
          />

          <LogicCard
            title="Señor de los Bucles"
            description="Utiliza bucles de forma eficiente en 3 mundos distintos."
            progressLabel="0/3 Mundos"
            progressValue={0}
            accent="gray"
            locked
            icon="infinity"
          />
        </div>
      </section>

      <section className="mt-8 px-2">
        <div className="flex items-center gap-2 text-[#231F2D]">
          <CrownIcon />
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Logros</h2>
        </div>

        <div className="mt-5">
          {achievementsLoading && <div>Cargando logros...</div>}
          {achievementsError && <div className="text-red-500">{achievementsError.message}</div>}
          {!achievementsLoading && !achievementsError && <AchievementList achievements={achievements} />}
        </div>
      </section>
    </div>
  );
};
