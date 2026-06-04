import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupField } from '../../components/auth/SignupField';
import { signupSchema } from '../../components/auth/SignupForm.schema';
import { SignupRoleCard } from '../../components/auth/SignupRoleCard';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/user.types';

type SignupStep = 'role' | 'form';

export const Signup = () => {
  const navigate = useNavigate();
  const { clearError, error, loading, signInWithGoogle, signUp } = useAuth();

  const [step, setStep] = useState<SignupStep>('role');
  const [role, setRole] = useState<UserRole>('child');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const displayedError = formError ?? error?.message ?? null;

  const handleRoleSelection = (selectedRole: UserRole): void => {
    clearError();
    setFormError(null);
    setRole(selectedRole);
    setStep('form');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);

    const parsedForm = signupSchema.safeParse({
      confirmPassword,
      email,
      fullName,
      password,
      role,
    });

    if (!parsedForm.success) {
      setFormError(parsedForm.error.issues[0]?.message ?? 'Revisa los datos del formulario.');
      return;
    }

    const didSignUp = await signUp(email, password, fullName, role);

    if (didSignUp) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleGoogleSignup = async (): Promise<void> => {
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
          {step === 'role' ? (
            <section className="w-full max-w-[980px]">
              <div className="text-center">
                <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-[#6D28D9] sm:text-[42px]">
                  Regístrate
                </h1>
                <p className="mt-2 text-[16px] text-[#5F5871]">¿Qué tipo de aventurero eres?</p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                <SignupRoleCard
                  title="Niño"
                  description="Aprende a programar jugando. Resuelve acertijos, gana medallas y embárcate en aventuras de código con nuestra mascota leopardo."
                  buttonLabel="Soy un explorador"
                  placeholderLabel="Imagen Niño"
                  accentClassName="border-t-[3px] border-t-[#7C3AED]"
                  titleClassName="text-[#6D28D9]"
                  buttonClassName="bg-[#F7B545] text-[#513600] shadow-[0_10px_22px_rgba(247,181,69,0.28)]"
                  onSelect={() => handleRoleSelection('child')}
                />

                <SignupRoleCard
                  title="Tutor"
                  description="Acompaña el aprendizaje. Supervisa el progreso, asigna misiones y apoya el desarrollo del pensamiento computacional de tus exploradores."
                  buttonLabel="Soy un guía"
                  placeholderLabel="Imagen Tutor"
                  accentClassName="border-t-[3px] border-t-[#0F948C]"
                  titleClassName="text-[#0F948C]"
                  buttonClassName="border border-[#8B5CF6] bg-[#F7F3FD] text-[#6D28D9]"
                  onSelect={() => handleRoleSelection('tutor')}
                />
              </div>

              <p className="mt-8 text-center text-[14px] text-[#6D28D9]">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="font-semibold"
                >
                  inicia sesión
                </button>
              </p>
            </section>
          ) : (
            <section className="w-full max-w-[980px] rounded-[18px] border border-[#E8E1F3] border-t-[3px] border-t-[#7C3AED] bg-white px-6 pb-8 pt-8 shadow-[0_18px_40px_rgba(124,58,237,0.09)] sm:px-10 lg:px-14 lg:pb-10">
              <div className="text-center">
                <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-[#6D28D9] sm:text-[42px]">
                  Registro
                </h1>
                <p className="mt-2 text-[16px] text-[#5F5871]">¡Únete a la aventura digital!</p>
              </div>

              {displayedError ? (
                <div className="mx-auto mt-6 max-w-[680px] rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#B91C1C]">
                  {displayedError}
                </div>
              ) : null}

              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <SignupField
                    label="Nombre"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder={
                      role === 'child' ? '¿Cómo te llamas, explorador?' : '¿Cómo te llamas, tutor?'
                    }
                    autoComplete="name"
                    required
                  />

                  <SignupField
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    required
                  />

                  <SignupField
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Crea una contraseña secreta"
                    autoComplete="new-password"
                    required
                    rightElement={
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword((current) => !current)}
                        className="inline-flex h-6 w-6 items-center justify-center"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 12C3.8 8.5 7.4 6 12 6C16.6 6 20.2 8.5 22 12C20.2 15.5 16.6 18 12 18C7.4 18 3.8 15.5 2 12Z"
                            stroke="#8D83A1"
                            strokeWidth="1.8"
                          />
                          <circle cx="12" cy="12" r="3" stroke="#8D83A1" strokeWidth="1.8" />
                        </svg>
                      </button>
                    }
                  />

                  <SignupField
                    label="Validar Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    required
                  />

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="mx-auto block h-[52px] w-full max-w-[360px] rounded-[10px] bg-[#F7B545] text-[18px] font-semibold text-[#563900] shadow-[0_10px_24px_rgba(247,181,69,0.25)] transition-transform duration-150 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Registrando...' : 'Registrarte'}
                    </button>
                  </div>
                </form>

                <div className="rounded-[16px] bg-[#F8F5FD] p-4 sm:p-5">
                  <div className="flex h-[196px] items-center justify-center rounded-[18px] border border-[#E5DDF2] bg-white text-[14px] font-medium text-[#A195B7]">
                    Imagen Registro
                  </div>

                  <div className="mt-6 flex items-center gap-3 text-[12px] text-[#8D83A1]">
                    <span className="h-px flex-1 bg-[#D9CFEA]" />
                    <span>O ingresa con</span>
                    <span className="h-px flex-1 bg-[#D9CFEA]" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="mt-5 flex h-[46px] w-full items-center justify-center gap-3 rounded-full border border-[#D7CCE8] bg-white px-5 text-[14px] font-medium text-[#231F2D] transition-colors hover:bg-[#FCFAFF] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <span>Continuar con Google</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center text-[14px] text-[#6F687C]">
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="font-semibold text-[#6D28D9]"
                  >
                    Inicia sesión
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="mt-3 text-[13px] font-medium text-[#8D83A1]"
                >
                  Cambiar tipo de usuario
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
