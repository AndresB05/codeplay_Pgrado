import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { getHomeRouteForRole } from '../../context/auth.helpers';
import { getDevCredentials, startGuestSession } from '../../context/guest.helpers';
import { useAuth } from '../../hooks/useAuth';
import { useRoleHomeRedirect } from '../../hooks/useRoleHomeRedirect';
import type { UserRole } from '../../types/user.types';
import { SectionContainer } from './shared';
import { DEV_TOOLS_ENABLED } from '../../config/devTools';
import { BrandLogo } from '../ui/BrandLogo';

/* `sectionId` nulo es lo más alto de la página. */
const centerLinks: { label: string; sectionId: string | null }[] = [
  { label: 'Inicio', sectionId: null },
  { label: 'Mundos', sectionId: 'mundos' },
  { label: 'Tutor', sectionId: 'tutores' },
  { label: 'Cómo aprender', sectionId: 'como-aprender' },
];

/* La barra es fija y tapa la parte de arriba: una sección cuenta como actual al pasar por debajo. */
const HEADER_OFFSET = 120;

const sectionInView = (): string | null => {
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
  let current: string | null = null;

  for (const { sectionId } of centerLinks) {
    const section = sectionId ? document.getElementById(sectionId) : null;

    if (!section) {
      continue;
    }

    /*
     * La última sección es corta y nunca llega arriba del todo: al tocar el
     * final de la página se da por actual.
     */
    if (section.getBoundingClientRect().top <= HEADER_OFFSET || atBottom) {
      current = sectionId;
    }
  }

  return current;
};

/*
 * La marca sigue al desplazamiento, no sólo al clic: si no, quien baja con la
 * rueda ve marcado un apartado que ya dejó atrás. Tras un clic se congela hasta
 * que el desplazamiento suave termina, para que no parpadee por las secciones
 * que cruza de camino.
 */
const useActiveSection = () => {
  const [active, setActive] = useState<string | null>(null);
  const pinnedRef = useRef(false);
  const settleTimerRef = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      if (pinnedRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(() => {
          pinnedRef.current = false;
        }, 150);
        return;
      }

      setActive(sectionInView());
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const select = (sectionId: string | null) => {
    pinnedRef.current = true;
    setActive(sectionId);

    /* Si ya estaba ahí no hay desplazamiento que la descongele. */
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      pinnedRef.current = false;
    }, 800);
  };

  return { active, select };
};

const guestEntries: { role: UserRole; label: string; className: string }[] = [
  {
    role: 'child',
    label: 'Niño',
    className: 'btn-sun',
  },
  {
    role: 'tutor',
    label: 'Tutor',
    className: 'btn-mint',
  },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const { active, select } = useActiveSection();
  const { clearError, error, loading, signIn } = useAuth();
  const { awaitingProfile, cancel, start } = useRoleHomeRedirect();

  const handleGuestEntry = async (role: UserRole): Promise<void> => {
    const credentials = getDevCredentials(role);

    // Sin credenciales configuradas queda el atajo de siempre, para que quien
    // clone el repositorio sin `.env` completo pueda entrar igual.
    if (!credentials) {
      startGuestSession(role);
      navigate(getHomeRouteForRole(role));
      return;
    }

    clearError();
    start();

    /*
     * Un fallo NO cae en la sesión de invitado: entrar con una sesión simulada
     * dejaría la aplicación aparentando funcionar mientras `auth.uid()` sigue
     * vacío, que es justo lo que este acceso viene a resolver.
     */
    const signedIn = await signIn(credentials.email, credentials.password);

    if (!signedIn) {
      cancel();
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-ink bg-white">
      <SectionContainer className="flex h-[84px] items-center justify-between gap-4">
        <Link
          to={ROUTES.LANDING}
          className="flex items-center gap-2 font-display text-[26px] tracking-[-0.02em] text-grape-dark sm:text-[32px]"
        >
          <BrandLogo size={52} />
          Codeplay
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {centerLinks.map((item) => {
            const isActive = active === item.sectionId;

            return (
              <a
                key={item.label}
                href={item.sectionId ? `#${item.sectionId}` : '#'}
                onClick={() => select(item.sectionId)}
                aria-current={isActive ? 'location' : undefined}
                className={`rounded-full border-[3px] px-5 py-2 font-display text-[16px] transition-colors ${
                  isActive
                    ? 'border-ink bg-grape-soft text-grape-dark'
                    : 'border-transparent text-ink hover:bg-cream'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to={ROUTES.LOGIN} className="btn btn-sm btn-ghost">
            Entrar
          </Link>
          <Link to={ROUTES.SIGNUP} className="btn btn-sm btn-grape">
            Regístrate
          </Link>

          {DEV_TOOLS_ENABLED ? (
            <div className="flex items-center gap-2 rounded-[16px] border-[3px] border-dashed border-line px-3 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                Sin login
              </span>
              {guestEntries.map((entry) => (
                <button
                  key={entry.role}
                  type="button"
                  onClick={() => void handleGuestEntry(entry.role)}
                  disabled={awaitingProfile || loading}
                  className={`btn btn-sm ${entry.className} disabled:opacity-60`}
                >
                  {entry.label}
                </button>
              ))}
              {error ? (
                <span role="alert" className="max-w-[220px] text-[11px] font-bold text-coral-dark">
                  {error.message}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <Link to={ROUTES.LOGIN} className="btn btn-sm btn-grape md:hidden">
          Entrar
        </Link>
      </SectionContainer>
    </header>
  );
};
