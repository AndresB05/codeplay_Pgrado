import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { FALLBACK_TEACHER_NAME } from '../../../services/classrooms.service';
import type { User } from '../../../types/user.types';
import { TUTOR_AVATAR } from '../../../constants/mascotAvatars';
import { BrandLogo } from '../../ui/BrandLogo';

interface TeacherTopBarProps {
  user: User | null;
}

const topLinks = [
  { label: 'Inicio', route: ROUTES.TEACHER_GROUPS },
  { label: 'Recursos', route: ROUTES.TEACHER_PANEL },
];

export const TeacherTopBar = ({ user }: TeacherTopBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = user?.fullName || FALLBACK_TEACHER_NAME;

  return (
    <header className="flex h-[84px] items-center justify-between border-b-[3px] border-ink bg-white px-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
        className="flex items-center gap-2 font-display text-[32px] tracking-[-0.02em] text-grape-dark"
      >
        <BrandLogo size={52} />
        CodePlay
      </button>

      <nav className="hidden items-center gap-3 md:flex">
        {topLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.route);

          return (
            <button
              key={link.label}
              type="button"
              onClick={() => navigate(link.route)}
              className={`rounded-full border-[3px] px-5 py-2 font-display text-[16px] transition-colors ${
                isActive
                  ? 'border-ink bg-grape-soft text-grape-dark'
                  : 'border-transparent text-ink hover:bg-cream'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <span className="chip chip-mint hidden lg:inline-flex">Panel de Tutor</span>

        <button
          type="button"
          onClick={() => navigate(ROUTES.TEACHER_SETTINGS)}
          className="flex h-[52px] items-center gap-2.5 rounded-full border-[3px] border-ink bg-grape-soft pl-1.5 pr-4 shadow-[0_4px_0_rgba(42,27,69,0.15)] transition-transform active:translate-y-[2px]"
          aria-label="Ajustes de cuenta"
        >
          <img
            src={TUTOR_AVATAR}
            alt=""
            className="h-[34px] w-[34px] rounded-full border-2 border-ink bg-cream object-cover"
          />
          <span className="font-display text-[16px] text-grape-dark">{displayName}</span>
        </button>
      </div>
    </header>
  );
};
