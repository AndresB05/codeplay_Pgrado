import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { User } from '../../../types/user.types';
import { XPBar } from '../../ui/XPBar';
import { BrandLogo } from '../../ui/BrandLogo';

const FireIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

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

        <div className="flex h-[52px] items-center gap-2 rounded-full border-[3px] border-ink bg-sun-soft px-5 font-display text-[18px] text-sun-dark shadow-[0_4px_0_rgba(42,27,69,0.15)]">
          <FireIcon />
          <span>{streakDays}</span>
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
