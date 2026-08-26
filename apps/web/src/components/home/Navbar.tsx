import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { getHomeRouteForRole } from '../../context/auth.helpers';
import { getDevCredentials, startGuestSession } from '../../context/guest.helpers';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/user.types';
import { SectionContainer } from './shared';

const centerLinks = [
  { label: 'Recursos', href: '#como-aprender' },
  { label: 'Tutor', href: '#tutores' },
  { label: 'Inicio', to: ROUTES.LANDING },
];

const guestEntries: { role: UserRole; label: string; className: string }[] = [
  {
    role: 'child',
    label: 'Niño',
    className: 'btn-sun',
  },
  {
    role: 'tutor',
    label: 'Profesor',
    className: 'btn-mint',
  },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearError, error, loading, signIn, user } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  /*
   * El rol lo decide el perfil que devuelve el servidor, no el botón pulsado.
   * Si la cuenta de prueba de tutor quedara con rol `child`, navegar por el
   * botón llevaría a un panel que `PrivateRoute` rebotaría acto seguido; así
   * el desajuste se ve en lugar de disimularse.
   */
  useEffect(() => {
    if (!signingIn || !user) {
      return;
    }

    setSigningIn(false);
    navigate(getHomeRouteForRole(user.role));
  }, [navigate, signingIn, user]);

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
    setSigningIn(true);

    /*
     * Un fallo NO cae en la sesión de invitado: entrar con una sesión simulada
     * dejaría la aplicación aparentando funcionar mientras `auth.uid()` sigue
     * vacío, que es justo lo que este acceso viene a resolver.
     */
    const signedIn = await signIn(credentials.email, credentials.password);

    if (!signedIn) {
      setSigningIn(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-ink bg-white">
      <SectionContainer className="flex h-[84px] items-center justify-between gap-4">
        <Link
          to={ROUTES.LANDING}
          className="flex items-center gap-2 font-display text-[26px] tracking-[-0.02em] text-grape-dark sm:text-[32px]"
        >
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border-[3px] border-ink bg-sun shadow-[0_4px_0_rgba(42,27,69,0.2)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 8L5 12L9 16M15 8L19 12L15 16"
                stroke="#2A1B45"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Codeplay
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {centerLinks.map((item) => {
            const active = 'to' in item && location.pathname === item.to;

            return 'href' in item ? (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full border-[3px] border-transparent px-5 py-2 font-display text-[16px] text-ink transition-colors hover:bg-cream"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded-full border-[3px] px-5 py-2 font-display text-[16px] transition-colors ${
                  active
                    ? 'border-ink bg-grape-soft text-grape-dark'
                    : 'border-transparent text-ink hover:bg-cream'
                }`}
              >
                {item.label}
              </Link>
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

          {import.meta.env.DEV ? (
            <div className="flex items-center gap-2 rounded-[16px] border-[3px] border-dashed border-line px-3 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                Sin login
              </span>
              {guestEntries.map((entry) => (
                <button
                  key={entry.role}
                  type="button"
                  onClick={() => void handleGuestEntry(entry.role)}
                  disabled={signingIn || loading}
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
