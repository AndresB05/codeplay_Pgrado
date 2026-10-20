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

  /*
   * Barra en el morado oscuro de la marca, liso y sin degradado: elegido por el
   * usuario para que la cabecera se distinga del fondo. El foco va en blanco
   * porque el contorno morado de siempre no se vería sobre el morado.
   */
  return (
    <header className="flex h-[56px] items-center gap-6 bg-grape-dark px-5 text-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
          className="tutor-focus flex items-center gap-2 rounded-[8px] font-display text-[22px] font-semibold tracking-[-0.01em] text-white focus-visible:outline-white"
        >
          <span className="flex rounded-full ring-2 ring-white">
            <BrandLogo size={34} />
          </span>
          CodePlay
        </button>

        <span className="border-l border-white/30 pl-3 text-[14px] font-semibold text-white/80">
          Tutor
        </span>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {topLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.route);

          return (
            <button
              key={link.label}
              type="button"
              onClick={() => navigate(link.route)}
              aria-current={isActive ? 'page' : undefined}
              className={`tutor-focus h-[34px] rounded-[8px] px-3 text-[14.5px] font-semibold text-white transition-colors focus-visible:outline-white ${
                isActive ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => navigate(ROUTES.TEACHER_SETTINGS)}
        className="tutor-focus ml-auto flex h-[40px] items-center gap-2.5 rounded-[8px] pl-1 pr-2.5 transition-colors hover:bg-white/10 focus-visible:outline-white"
        aria-label="Ajustes de cuenta"
      >
        <img
          src={TUTOR_AVATAR}
          alt=""
          className="h-[32px] w-[32px] rounded-full border-2 border-white bg-tutor-sunken object-cover"
        />
        <span className="text-[14.5px] font-semibold">{displayName}</span>
      </button>
    </header>
  );
};
