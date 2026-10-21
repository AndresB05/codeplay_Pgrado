import { useNavigate } from 'react-router-dom';
import streakScroll from '../../../assets/brand/topbar-streak-scroll-bold.webp';
import { ROUTES } from '../../../constants/routes';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { User } from '../../../types/user.types';
import { XPBar } from '../../ui/XPBar';
import { BrandLogo } from '../../ui/BrandLogo';

type StudentTopBarProps = {
  user: User | null;
};

export const StudentTopBar = ({ user }: StudentTopBarProps) => {
  const navigate = useNavigate();
  const streakDays = user?.streakDays ?? 0;

  return (
    <header className="wood-top-bar relative z-10 flex h-[84px] items-center justify-between gap-3 border-b-4 border-wood-ink px-4 sm:px-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.WORLDS)}
        className="flex shrink-0 items-center gap-2 font-display text-[32px] tracking-[-0.02em] text-wood-ink"
      >
        <BrandLogo size={52} />
        {/* En el móvil la palabra cede su sitio al XP, que allí no tiene otra barra que lo enseñe. */}
        <span className="max-sm:sr-only">CodePlay</span>
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
          className={`relative h-[52px] w-[76px] shrink-0 sm:h-[64px] sm:w-[93px] drop-shadow-[0_3px_0_rgba(42,27,69,0.15)] ${
            streakDays === 0 ? 'grayscale' : ''
          }`}
        >
          <img src={streakScroll} alt="" className="h-full w-full" />
          <span className="sr-only">Días de racha:</span>
          <span className="absolute right-[9px] top-1/2 flex w-[33px] -translate-y-1/2 justify-center font-map text-[22px] sm:right-[11px] sm:w-[40px] sm:text-[26px] leading-none text-sepia">
            {streakDays}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full sm:h-[52px] sm:w-[52px] border-[3px] border-ink bg-grape-soft shadow-[0_4px_0_rgba(42,27,69,0.15)] transition-transform active:translate-y-[2px]"
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
