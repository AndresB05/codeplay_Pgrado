import type { MouseEvent, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../hooks/useAuth';
import { useAchievements } from '../../../hooks/useAchievements';
import { AchievementList } from '../AchievementList/AchievementList';
import { TropicalFlower } from '../../decor/JungleDecor';
import { trophyPercent, worldTrophyProgress } from '../../../lib/trophyProgress';
import trophyWorld1 from '../../../assets/brand/trophy-world-1.webp';
import trophyWorld2 from '../../../assets/brand/trophy-world-2.webp';
import trophyWorld3 from '../../../assets/brand/trophy-world-3.webp';
import trophyPolaroid from '../../../assets/brand/trophy-polaroid.webp';

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
  unlocked: boolean;
  accent: keyof typeof bigCardStyles;
  image: string;
};

/* El color de cada mundo sobrevive a la madera en la barra y en la medalla. */
const bigCardStyles = {
  jungle: { bar: '#1F9D5B', medal: '#FFC93C' },
  grape: { bar: '#7B3FE4', medal: '#FFC93C' },
  sun: { bar: '#FFC93C', medal: '#FF8A3D' },
  /* El tercero entra con el paso 22: los mundos son tres, y las tarjetas también. */
  sky: { bar: '#2BA7DD', medal: '#FFC93C' },
};

/* El dorado del confeti, que se mezcla con el color del mundo de cada trofeo. */
const CONFETTI_GOLD = ['#FFC93C', '#FFE29A'];

/*
 * UNA TARJETA GRANDE POR MUNDO, en el orden del catálogo. Las claves las fija la
 * migración 0036 derivando del `sort_order` del mundo, así que esta lista y
 * aquélla se leen juntas.
 */
const WORLD_TROPHIES: {
  key: string;
  order: number;
  accent: keyof typeof bigCardStyles;
  image: string;
}[] = [
  { key: 'perfect_world_1', order: 1, accent: 'jungle', image: trophyWorld1 },
  { key: 'perfect_world_2', order: 2, accent: 'grape', image: trophyWorld2 },
  { key: 'perfect_world_3', order: 3, accent: 'sky', image: trophyWorld3 },
];

/* Los de mundo ya tienen su tarjeta grande: repetirlos abajo los contaba dos veces. */
const WORLD_TROPHY_KEYS = new Set(WORLD_TROPHIES.map((trophy) => trophy.key));


const BigTrophyCard = ({
  title,
  description,
  progressLabel,
  progressValue,
  awardedXp,
  unlocked,
  accent,
  image,
}: BigTrophyCardProps) => {
  const style = bigCardStyles[accent];

  const celebrate = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();

    void confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 38,
      origin: {
        x: (box.left + box.width / 2) / window.innerWidth,
        y: (box.top + box.height / 3) / window.innerHeight,
      },
      colors: [style.bar, ...CONFETTI_GOLD],
      disableForReducedMotion: true,
    });
  };

  return (
    <article className={`wood-plank relative ${unlocked ? '' : 'grayscale'}`}>
      {/*
       * Sólo lo conseguido celebra: confeti sobre un trofeo en gris le diría al
       * niño que ya lo ganó. Es un botón encima de toda la tarjeta y no la
       * tarjeta hecha botón, para que el lector de pantalla siga leyendo el
       * título y la descripción.
       */}
      {unlocked ? (
        <button
          type="button"
          onClick={celebrate}
          aria-label={`Celebrar el trofeo ${title}`}
          className="absolute inset-0 z-30 cursor-pointer rounded-[18px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-sun"
        />
      ) : null}

      <div className="trophy-log flex items-center gap-3 py-1 pl-1">
        <span className="wood-well flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px]">
          <MedalIcon color={style.medal} />
        </span>

        <div className="wood-bare min-w-0 rounded-[12px] px-3 py-1.5">
          <h3 className="wood-deep font-display text-[22px] leading-tight">{title}</h3>
        </div>
      </div>

      <div className="trophy-board relative mx-6 -mt-1 sm:mx-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
          <div className="wood-bare translate-x-2 rounded-[12px] px-4 py-3">
            <p className="wood-deep text-[15px] font-semibold leading-[1.5]">{description}</p>

            <div className="wood-well mt-4 h-[14px] w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{ width: `${progressValue}%`, background: style.bar }}
              />
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <span className="chip wood-well wood-carved py-0.5">+{awardedXp} XP</span>
              <span className="chip wood-well wood-carved py-0.5">{progressLabel}</span>
            </div>
          </div>

          {/*
           * El hueco mide lo mismo que medía la imagen enmarcada, y la foto va
           * suelta encima, centrada en él: así el tablón no cambia de tamaño
           * aunque la foto sobresalga. La ilustración va DEBAJO del marco,
           * girada lo mismo que su ventana; los porcentajes salen de medir esa
           * ventana en `trophy-polaroid.webp`, así que cambian con la imagen.
           */}
          <div className="relative aspect-[3/2] sm:aspect-auto">
            <div className="absolute left-1/2 top-1/2 z-20 aspect-[440/589] w-[180px] -translate-x-1/2 -translate-y-1/2">
              <img
                src={image}
                alt=""
                className="absolute left-[10.67%] top-[16.16%] h-[62.2%] w-[79%] rotate-[4.15deg] object-cover object-top"
              />
              <img src={trophyPolaroid} alt="" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/*
       * Tapa el borde de abajo del tablón, pero la foto que sobresale va por
       * encima de él: por eso el tronco lleva `z-10` y la foto `z-20`.
       */}
      <div className="trophy-log relative z-10 -mt-6 h-[84px]" aria-hidden="true" />
    </article>
  );
};

/* En un tronco del tamaño de su contenido, como un letrero: suelto, flotaba sobre la madera. */
const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="trophy-log flex w-fit max-w-full items-center gap-3 py-1 pl-1">
    <span className="wood-well flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[16px]">
      {icon}
    </span>
    <div className="wood-bare min-w-0 rounded-[12px] px-3 py-1.5">
      <h2 className="wood-deep font-display text-[24px] leading-tight">{title}</h2>
    </div>
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
      <section className="trophy-log px-2 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="wood-well wood-carved flex h-[56px] w-[56px] items-center justify-center rounded-[18px]">
            <TrophyIcon />
          </span>

          <div className="wood-bare rounded-[12px] px-4 py-2">
            <h1 className="wood-deep font-display text-[32px] leading-tight">Sala de Trofeos</h1>
            <p className="wood-deep mt-1 text-[16px] font-semibold">
              Todo lo que has conquistado en la selva del código, en un solo lugar.
            </p>
          </div>

          <span className="chip wood-well wood-carved ml-auto py-0.5">
            <TropicalFlower size={16} />
            Sigue coleccionando
          </span>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<CrownIcon />} title="Grandes trofeos" />

        <p className="subtitle dark-wood-label mt-2">
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
                unlocked={unlocked}
                accent={trophy.accent}
                image={trophy.image}
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
