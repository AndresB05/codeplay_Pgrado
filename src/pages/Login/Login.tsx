import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupField } from '../../components/auth/SignupField';
import { loginSchema } from '../../components/auth/LoginForm.schema';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.10),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,184,64,0.16),_transparent_32%),#F6F3FA] px-6 py-4 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1250px] flex-col">
        <div className="pt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#6D28D9] sm:text-[20px]">
          <Link to={ROUTES.LANDING}>Codeplay</Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <section className="w-full max-w-[1080px] overflow-hidden rounded-[18px] border border-[#E8E1F3] border-t-[3px] border-t-[#7C3AED] bg-white shadow-[0_18px_40px_rgba(124,58,237,0.09)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
              <div className="px-7 pb-8 pt-8 sm:px-10 lg:px-8 lg:pb-10 lg:pt-10 xl:px-12">
                <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-[#6D28D9] sm:text-[42px]">
                  Inicia sesión
                </h1>
                <p className="mt-2 text-[16px] text-[#5F5871]">
                  ¡Bienvenido de vuelta al safari digital!
                </p>

                {displayedError ? (
                  <div className="mt-6 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#B91C1C]">
                    {displayedError}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <SignupField
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="¿Cuál es tu correo?"
                    autoComplete="email"
                    required
                    rightElement={
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 7.5C4 6.67 4.67 6 5.5 6H18.5C19.33 6 20 6.67 20 7.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V7.5Z"
                          stroke="#8D83A1"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M5 8L12 13L19 8"
                          stroke="#8D83A1"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="block text-[13px] font-semibold text-[#231F2D]">
                        Contraseña
                      </span>
                      <button type="button" className="text-[12px] font-medium text-[#8B5CF6]">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <SignupField
                      label=""
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Tu clave secreta"
                      autoComplete="current-password"
                      required
                      className="pr-12"
                      rightElement={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.5 10V8.5C7.5 6.01 9.51 4 12 4C14.49 4 16.5 6.01 16.5 8.5V10"
                            stroke="#8D83A1"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <rect
                            x="5"
                            y="10"
                            width="14"
                            height="10"
                            rx="2"
                            stroke="#8D83A1"
                            strokeWidth="1.8"
                          />
                        </svg>
                      }
                    />
                  </div>

                  <div className="pt-4 text-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-[#231F2D] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>{loading ? 'Iniciando...' : 'Inicia sesión'}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>

                <div className="mt-7 flex items-center gap-3 text-[12px] text-[#8D83A1]">
                  <span className="h-px flex-1 bg-[#D9CFEA]" />
                  <span>O</span>
                  <span className="h-px flex-1 bg-[#D9CFEA]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-6 flex h-[46px] w-full items-center justify-center gap-3 rounded-full border border-[#D7CCE8] bg-white px-5 text-[14px] font-medium text-[#231F2D] transition-colors hover:bg-[#FCFAFF] disabled:cursor-not-allowed disabled:opacity-60"
                >
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
                  <span>Inicia con Google</span>
                </button>

                <p className="mt-7 text-center text-[14px] text-[#6F687C]">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.SIGNUP)}
                    className="font-semibold text-[#6D28D9]"
                  >
                    Regístrate
                  </button>
                </p>
              </div>

              <div className="flex items-center justify-center bg-[radial-gradient(circle_at_bottom,_rgba(247,181,69,0.20),_transparent_28%),linear-gradient(180deg,#F6F3FA_0%,#F2EEFC_100%)] px-8 py-8 sm:px-10 lg:px-8 lg:py-10 xl:px-12">
                <div className="flex h-[260px] w-full max-w-[440px] items-center justify-center rounded-[14px] border border-white/80 bg-white text-[15px] font-medium text-[#A195B7] shadow-[0_18px_32px_rgba(124,58,237,0.10)] sm:h-[320px] lg:h-[380px]">
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
