import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import type { User } from '../../../types/user.types';
import { MonsteraLeaf, PalmFrond, TropicalFlower } from '../../decor/JungleDecor';

type StudentSettingsModuleProps = {
  user: User | null;
};

const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const StudentSettingsModule = ({ user }: StudentSettingsModuleProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = user?.fullName || 'Explorer Leo';
  const email = user?.email || 'explorador@codeplay.co';
  const streakDays = user?.streakDays || 42;
  const xp = user?.xp || 0;

  const handleSignOut = async (): Promise<void> => {
    endGuestSession();

    // `signOut` es lo que cierra la sesión de verdad: el acceso sin login
    // autentica contra Supabase cuando hay cuentas de prueba. `endGuestSession`
    // queda por el atajo antiguo, que no se retira hasta el paso 24.
    await signOut();
    navigate(ROUTES.LANDING);
  };

  return (
    <div className="px-5 py-5">
      <div className="mx-auto max-w-[980px]">
        <section className="card relative flex flex-wrap items-center justify-between gap-4 overflow-hidden px-6 py-6">
          <PalmFrond
            size={92}
            className="pointer-events-none absolute -right-6 -top-8 -scale-x-100 rotate-[12deg] opacity-70"
          />

          <div className="relative">
            <span className="chip chip-grape">Cuenta</span>
            <h1 className="title-xl mt-2">Mi cuenta</h1>
            <p className="subtitle mt-1">Aquí vive tu identidad de explorador.</p>
          </div>

          <button type="button" onClick={() => void handleSignOut()} className="btn btn-coral">
            Cerrar sesión
          </button>
        </section>

        <section className="card mt-6 px-6 py-6">
          <h2 className="title-lg">Detalles del explorador</h2>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Hueco reservado para el avatar de la mascota. */}
            <div className="flex h-[118px] w-[118px] shrink-0 items-center justify-center rounded-full border-[3px] border-dashed border-line bg-cream font-display text-[14px] text-ink-faint">
              Avatar
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[30px] leading-tight text-grape-dark">
                {displayName}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="chip chip-sun">
                  <FireIcon />
                  {streakDays} días de racha
                </span>
                <span className="chip chip-leaf">
                  <TropicalFlower size={16} />
                  {xp} XP
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border-2 border-line bg-cream px-4 py-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                    Email / Nombre de usuario
                  </p>
                  <p className="mt-1 break-words text-[17px] font-bold text-ink">{email}</p>
                </div>

                <div className="rounded-[18px] border-2 border-line bg-cream px-4 py-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                    Rol
                  </p>
                  <p className="mt-1 text-[17px] font-bold text-grape-dark">
                    {user?.role === 'tutor' ? 'Tutor' : 'Explorador'}
                  </p>
                </div>
              </div>

              <button type="button" className="btn btn-ghost mt-6">
                Cambiar contraseña
              </button>
            </div>
          </div>
        </section>

        <section className="card relative mt-6 overflow-hidden px-6 py-6">
          <MonsteraLeaf
            size={80}
            className="pointer-events-none absolute -left-6 -bottom-8 rotate-[24deg] opacity-70"
          />

          <div className="relative">
            <h2 className="title-lg">Vuelve a la expedición</h2>
            <p className="subtitle mt-1">Tus mundos y trofeos siguen esperando en la selva.</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.WORLDS)}
                className="btn btn-grape"
              >
                Ir a mundos
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.TROPHY_ROOM)}
                className="btn btn-sun"
              >
                Sala de trofeos
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.CLASSROOM)}
                className="btn btn-mint"
              >
                Mi salón
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
