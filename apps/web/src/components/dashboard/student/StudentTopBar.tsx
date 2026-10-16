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
    <header className="flex h-[84px] items-center justify-between border-b-[3px] border-ink bg-white px-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.WORLDS)}
        className="flex items-center gap-2 font-display text-[32px] tracking-[-0.02em] text-grape-dark"
      >
        <BrandLogo size={52} />
        CodePlay
      </button>

      <div className="flex items-center gap-3">
        {/* Ancho fijo: sin acotarla, la barra crece con la cabecera y empuja el resto. */}
        <div className="hidden w-[150px] sm:block">
          <XPBar xp={user?.xp ?? 0} />
        </div>

        {/*
         * La racha, escrita a mano en una tira de pergamino con su fueguito,
         * como la notita de racha del salón: en gris mientras está en cero.
         */}
        <div
          className={`relative h-[64px] w-[93px] shrink-0 drop-shadow-[0_3px_0_rgba(42,27,69,0.15)] ${
            streakDays === 0 ? 'grayscale' : ''
          }`}
        >
          <img src={streakScroll} alt="" className="h-full w-full" />
          <span className="sr-only">Días de racha:</span>
          <span className="absolute right-[11px] top-1/2 flex w-[40px] -translate-y-1/2 justify-center font-map text-[26px] leading-none text-sepia">
            {streakDays}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="h-[52px] w-[52px] overflow-hidden rounded-full border-[3px] border-ink bg-grape-soft shadow-[0_4px_0_rgba(42,27,69,0.15)] transition-transform active:translate-y-[2px]"
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
