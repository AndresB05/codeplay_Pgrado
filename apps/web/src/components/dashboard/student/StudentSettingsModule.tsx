import { useNavigate } from 'react-router-dom';
import passportLeopard from '../../../assets/brand/settings-leopard-sticker.webp';
import stampClassroom from '../../../assets/brand/settings-stamp-classroom.webp';
import stampTrophies from '../../../assets/brand/settings-stamp-trophies.webp';
import stampWorlds from '../../../assets/brand/settings-stamp-worlds.webp';
import { explorerLevel } from '../../../constants/progress';
import { ROUTES } from '../../../constants/routes';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import { FALLBACK_STUDENT_NAME } from '../../../services/classrooms.service';
import type { User } from '../../../types/user.types';
import { TropicalFlower } from '../../decor/JungleDecor';
import { ChangeAvatarPanel } from '../shared/ChangeAvatarPanel';
import { ChangeNamePanel } from '../shared/ChangeNamePanel';
import { ChangePasswordPanel } from '../shared/ChangePasswordPanel';
import { DeleteAccountPanel } from '../shared/DeleteAccountPanel';
import { streakLabel } from '../../../lib/streak';

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

const VISA_STAMPS = [
  { label: 'Ir a mundos', route: ROUTES.WORLDS, image: stampWorlds, tilt: '-rotate-[8deg]' },
  { label: 'Sala de trofeos', route: ROUTES.TROPHY_ROOM, image: stampTrophies, tilt: 'rotate-[5deg]' },
  { label: 'Mi salón', route: ROUTES.CLASSROOM, image: stampClassroom, tilt: '-rotate-[3deg]' },
];

export const StudentSettingsModule = ({ user }: StudentSettingsModuleProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = user?.fullName || FALLBACK_STUDENT_NAME;
  const email = user?.email;
  const streakDays = user?.streakDays ?? 0;
  const xp = user?.xp ?? 0;

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
        {/* La cuenta es la tienda del explorador: la cabecera, una banda de cuero con Leo y su pasaporte. */}
        <section className="relative isolate flex min-h-[156px] flex-wrap items-center gap-5 px-7 py-5 sm:px-12">
          <div aria-hidden className="leather-band pointer-events-none absolute inset-0 -z-10" />

          <img
            src={passportLeopard}
            alt=""
            aria-hidden
            className="pointer-events-none h-[130px] w-auto sm:-my-10 sm:h-[200px] shrink-0 drop-shadow-[0_4px_0_rgba(42,27,69,0.25)]"
          />

          <div className="min-w-[180px] flex-1">
            <h1 className="font-display text-[34px] sm:text-[40px] leading-tight text-cream drop-shadow-[0_3px_0_rgba(42,27,69,0.45)]">
              Mi cuenta
            </h1>
            <p className="mt-1 text-[17px] font-bold text-cream/85">
              Aquí vive tu identidad de explorador.
            </p>
          </div>

          <button type="button" onClick={() => void handleSignOut()} className="btn btn-coral">
            Cerrar sesión
          </button>
        </section>

        {/* Los datos del niño, en la página de su pasaporte: crece con los formularios. */}
        <section className="relative isolate mt-6 px-8 py-10 sm:px-14 sm:py-12">
          <div aria-hidden className="passport-page pointer-events-none absolute inset-0 -z-10" />

          <h2 className="title-lg">Detalles del explorador</h2>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-[118px] w-[118px] shrink-0 overflow-hidden rounded-full border-[3px] border-ink">
              <img
                src={pickMascotAvatar(user?.id, user?.fullName, user?.avatarKey)}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[30px] leading-tight text-grape-dark">
                {displayName}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="chip chip-sun">
                  <FireIcon />
                  {streakLabel(streakDays)} de racha
                </span>
                <span className="chip chip-leaf">
                  <TropicalFlower size={16} />
                  {xp} XP
                </span>
                {/* El tramo, aquí sin barra: es la ficha del explorador, no su progreso. */}
                <span className="chip chip-mint">Nivel Explorador {explorerLevel(xp)}</span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border-2 border-line bg-cream px-4 py-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                    Correo
                  </p>
                  <p className="mt-1 break-words text-[17px] font-bold text-ink">
                    {email ?? <span className="text-ink-faint">Sin correo asociado</span>}
                  </p>
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

              <ChangeAvatarPanel />
              <ChangeNamePanel />
              <ChangePasswordPanel />
              <DeleteAccountPanel />
            </div>
          </div>
        </section>

        {/* Los atajos son sellos de visado: cada uno lleva a un sitio de la expedición. */}
        <section className="relative isolate mt-6 flex flex-wrap items-center gap-6 px-7 py-6 sm:px-12">
          <div aria-hidden className="leather-band pointer-events-none absolute inset-0 -z-10" />

          <div className="min-w-[220px] flex-1">
            <h2 className="font-display text-[30px] leading-tight text-cream drop-shadow-[0_3px_0_rgba(42,27,69,0.45)]">
              Vuelve a la expedición
            </h2>
            <p className="mt-1 text-[16px] font-bold text-cream/85">
              Tus mundos y trofeos siguen esperando en la selva.
            </p>
          </div>

          <div className="flex flex-wrap gap-5">
            {VISA_STAMPS.map((stamp) => (
              <button
                key={stamp.label}
                type="button"
                onClick={() => navigate(stamp.route)}
                className="group flex flex-col items-center gap-1"
              >
                <img
                  src={stamp.image}
                  alt=""
                  className={`h-[88px] w-[88px] transition-transform duration-150 group-hover:rotate-0 group-hover:scale-110 motion-reduce:transition-none ${stamp.tilt}`}
                />
                <span className="whitespace-nowrap font-display text-[16px] text-cream drop-shadow-[0_2px_0_rgba(42,27,69,0.45)]">
                  {stamp.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
