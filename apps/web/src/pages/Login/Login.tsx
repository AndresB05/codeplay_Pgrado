import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupField } from '../../components/auth/SignupField';
import { loginSchema } from '../../components/auth/LoginForm.schema';
import { Canopy, MonsteraLeaf, Toucan } from '../../components/decor/JungleDecor';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

const GoogleMark = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const Login = () => {
  const navigate = useNavigate();
  const { clearError, error, loading, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const displayedError = formError ?? error?.message ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);

    const parsedForm = loginSchema.safeParse({ email, password });

    if (!parsedForm.success) {
      setFormError(parsedForm.error.issues[0]?.message ?? 'Revisa los datos del formulario.');
      return;
    }

    const didSignIn = await signIn(email, password);

    if (didSignIn) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    clearError();
    setFormError(null);
    await signInWithGoogle();
  };

  return (
    <div className="jungle-surface relative min-h-screen overflow-hidden px-6 py-4 sm:px-8 lg:px-10">
      <Canopy />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1250px] flex-col">
        <Link
          to={ROUTES.LANDING}
          className="flex items-center gap-2 pt-2 font-display text-[26px] tracking-[-0.02em] text-grape-dark"
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] border-[3px] border-ink bg-sun shadow-[0_4px_0_rgba(42,27,69,0.2)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <section className="card w-full max-w-[1080px] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
              <div className="px-7 pb-8 pt-8 sm:px-10 lg:px-8 lg:pb-10 lg:pt-10 xl:px-12">
                <span className="chip chip-leaf">De vuelta al safari digital</span>

                <h1 className="title-xl mt-3">Inicia sesión</h1>
                <p className="subtitle mt-1">
                  Tus mundos, tus trofeos y tu racha te están esperando.
                </p>

                {displayedError ? (
                  <div className="mt-6 rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark">
                    {displayedError}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                  <SignupField
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="¿Cuál es tu correo?"
                    autoComplete="email"
                    required
                    rightElement={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 7.5C4 6.67 4.67 6 5.5 6H18.5C19.33 6 20 6.67 20 7.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V7.5Z"
                          stroke="#8B82A6"
                          strokeWidth="2.2"
                        />
                        <path
                          d="M5 8L12 13L19 8"
                          stroke="#8B82A6"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="field-label">Contraseña</span>
                      <button
                        type="button"
                        className="text-[13px] font-bold text-grape-dark hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>

                    <SignupField
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Tu clave secreta"
                      autoComplete="current-password"
                      required
                      rightElement={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M7.5 10V8.5C7.5 6.01 9.51 4 12 4C14.49 4 16.5 6.01 16.5 8.5V10"
                            stroke="#8B82A6"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                          <rect
                            x="5"
                            y="10"
                            width="14"
                            height="10"
                            rx="3"
                            stroke="#8B82A6"
                            strokeWidth="2.2"
                          />
                        </svg>
                      }
                    />
                  </div>

                  <div className="pt-3">
                    <button type="submit" disabled={loading} className="btn btn-grape w-full">
                      {loading ? 'Iniciando...' : 'Inicia sesión'}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>

                <div className="mt-7 flex items-center gap-3 text-[13px] font-bold text-ink-faint">
                  <span className="h-[3px] flex-1 rounded-full bg-line" />
                  <span>O</span>
                  <span className="h-[3px] flex-1 rounded-full bg-line" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-6 flex h-[52px] w-full items-center justify-center gap-3 rounded-full border-[3px] border-ink bg-white px-5 font-display text-[16px] text-ink shadow-[0_4px_0_rgba(42,27,69,0.15)] transition-transform active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <GoogleMark />
                  <span>Inicia con Google</span>
                </button>

                <p className="mt-7 text-center text-[15px] font-bold text-ink-soft">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.SIGNUP)}
                    className="font-display text-grape-dark hover:underline"
                  >
                    Regístrate
                  </button>
                </p>
              </div>

              <div
                className="relative flex items-center justify-center border-t-[3px] border-ink px-8 py-8 sm:px-10 lg:border-l-[3px] lg:border-t-0 lg:px-8 lg:py-10 xl:px-12"
                style={{ background: 'linear-gradient(160deg, #7CE6DA 0%, #17C3B2 100%)' }}
              >
                <MonsteraLeaf
                  size={110}
                  className="pointer-events-none absolute -left-8 top-6 rotate-[24deg]"
                  color="#12703D"
                />
                <Toucan size={92} className="pointer-events-none absolute -bottom-3 right-4" />

                {/* Hueco reservado para la ilustración de la mascota. */}
                <div className="relative flex h-[260px] w-full max-w-[440px] items-center justify-center rounded-[22px] border-[3px] border-dashed border-white/75 bg-white/25 font-display text-[15px] text-white sm:h-[320px] lg:h-[380px]">
                  Imagen Login
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
