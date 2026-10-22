import { useNavigate } from 'react-router-dom';
import streakScroll from '../../../assets/brand/topbar-streak-scroll-bold.webp';
import { ROUTES } from '../../../constants/routes';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { User } from '../../../types/user.types';
import { XPBar } from '../../ui/XPBar';
import { BrandLogo } from '../../ui/BrandLogo';

type StudentTopBarProps = {
  user: User | null;
  /** Más baja, para el nivel en pantallas estrechas: cada píxel es del lienzo. */
  slim?: boolean;
};

export const StudentTopBar = ({ user, slim = false }: StudentTopBarProps) => {
  const navigate = useNavigate();
  const streakDays = user?.streakDays ?? 0;

  return (
    <header
      className={`wood-top-bar relative z-10 flex items-center justify-between gap-3 border-b-4 border-wood-ink px-4 sm:px-5 ${
        slim ? 'h-[60px]' : 'h-[84px]'
      }`}
    >
      <button
        type="button"
        onClick={() => navigate(ROUTES.WORLDS)}
        className="flex shrink-0 items-center gap-2 font-display text-[32px] tracking-[-0.02em] text-wood-ink"
      >
        <BrandLogo size={slim ? 40 : 52} />
        {/* En el móvil la palabra cede su sitio al XP, que allí no tiene otra barra que lo enseñe. */}
        <span className={slim ? 'sr-only' : 'max-sm:sr-only'}>CodePlay</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {/* Ancho fijo: sin acotarla, la barra crece con la cabecera y empuja el resto. */}
        <div className="min-w-0 max-w-[150px] flex-1 sm:w-[150px] sm:flex-none">
          <XPBar xp={user?.xp ?? 0} />
        </div>

        {/*
         * La racha, escrita a mano en una tira de pergamino con su fueguito,
         * como la notita de racha del salón: en gris mientras está en cero.
         */}
        <div
          className={`relative shrink-0 drop-shadow-[0_3px_0_rgba(42,27,69,0.15)] ${
            slim ? 'h-[42px] w-[61px]' : 'h-[52px] w-[76px] sm:h-[64px] sm:w-[93px]'
          } ${streakDays === 0 ? 'grayscale' : ''}`}
        >
          <img src={streakScroll} alt="" className="h-full w-full" />
          <span className="sr-only">Días de racha:</span>
          <span
            className={`absolute top-1/2 flex -translate-y-1/2 justify-center font-map leading-none text-sepia ${
              slim
                ? 'right-[7px] w-[27px] text-[18px]'
                : 'right-[9px] w-[33px] text-[22px] sm:right-[11px] sm:w-[40px] sm:text-[26px]'
            }`}
          >
            {streakDays}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className={`shrink-0 overflow-hidden rounded-full border-[3px] border-ink bg-grape-soft shadow-[0_4px_0_rgba(42,27,69,0.15)] transition-transform active:translate-y-[2px] ${
            slim ? 'h-[40px] w-[40px]' : 'h-[44px] w-[44px] sm:h-[52px] sm:w-[52px]'
          }`}
          aria-label="Perfil"
        >
          <img
            src={pickMascotAvatar(user?.id, user?.fullName, user?.avatarKey)}
            alt=""
            className="h-full w-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
