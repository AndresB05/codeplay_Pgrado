import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupField } from '../../components/auth/SignupField';
import { signupSchema } from '../../components/auth/SignupForm.schema';
import { SignupRoleCard } from '../../components/auth/SignupRoleCard';
import {
  Canopy,
  MonsteraLeaf,
  PalmFrond,
  TropicalFlower,
} from '../../components/decor/JungleDecor';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useRoleHomeRedirect } from '../../hooks/useRoleHomeRedirect';
import type { UserRole } from '../../types/user.types';

type SignupStep = 'role' | 'form';

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

export const Signup = () => {
  const navigate = useNavigate();
  const { clearError, error, loading, signInWithGoogle, signUp } = useAuth();
  const { awaitingProfile, cancel, start } = useRoleHomeRedirect();

  const [step, setStep] = useState<SignupStep>('role');
  const [role, setRole] = useState<UserRole>('child');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const displayedError = formError ?? error?.message ?? null;

  const handleRoleSelection = (selectedRole: UserRole): void => {
    clearError();
    setFormError(null);
    setPendingConfirmation(false);
    setRole(selectedRole);
    setStep('form');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);
    setPendingConfirmation(false);

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

    start();

    const outcome = await signUp(email, password, fullName, role);

    if (outcome !== 'signed-in') {
      cancel();
    }

    // La cuenta se creó pero el servidor no abrió sesión: no hay panel al que ir
    // todavía, así que se queda aquí y se dice por qué.
    if (outcome === 'confirmation-required') {
      setPendingConfirmation(true);
    }
  };

  const handleGoogleSignup = async (): Promise<void> => {
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
          {step === 'role' ? (
            <section className="w-full max-w-[980px]">
              <div className="text-center">
                <h1 className="title-xl">Regístrate</h1>
                <p className="subtitle mt-1">¿Qué tipo de aventurero eres?</p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                <SignupRoleCard
                  title="Niño"
                  description="Aprende a programar jugando. Resuelve acertijos, gana medallas y embárcate en aventuras de código con nuestra mascota leopardo."
                  buttonLabel="Soy un explorador"
                  placeholderLabel="Imagen Niño"
                  tone="grape"
                  decor={
                    <MonsteraLeaf
                      size={74}
                      className="pointer-events-none absolute -left-5 bottom-2 rotate-[22deg]"
                      color="#12703D"
                    />
                  }
                  onSelect={() => handleRoleSelection('child')}
                />

                <SignupRoleCard
                  title="Tutor"
                  description="Acompaña el aprendizaje. Supervisa el progreso, asigna misiones y apoya el desarrollo del pensamiento computacional de tus exploradores."
                  buttonLabel="Soy un guía"
                  placeholderLabel="Imagen Tutor"
                  tone="mint"
                  decor={
                    <PalmFrond
                      size={74}
                      className="pointer-events-none absolute -right-4 bottom-1 -scale-x-100 rotate-[12deg]"
                      color="#1F9D5B"
                    />
                  }
                  onSelect={() => handleRoleSelection('tutor')}
                />
              </div>

              <p className="mt-8 text-center text-[15px] font-bold text-ink-soft">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="font-display text-grape-dark hover:underline"
                >
                  inicia sesión
                </button>
              </p>
            </section>
          ) : (
            <section className="card w-full max-w-[980px] px-6 pb-8 pt-8 sm:px-10 lg:px-14 lg:pb-10">
              <div className="text-center">
                <span className={`chip ${role === 'child' ? 'chip-grape' : 'chip-mint'}`}>
                  {role === 'child' ? 'Explorador' : 'Tutor'}
                </span>

                <h1 className="title-xl mt-3">Registro</h1>
                <p className="subtitle mt-1">¡Únete a la aventura digital!</p>
              </div>

              {displayedError ? (
                <div className="mx-auto mt-6 max-w-[680px] rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark">
                  {displayedError}
                </div>
              ) : null}

              {pendingConfirmation ? (
                <div
                  role="status"
                  className="mx-auto mt-6 max-w-[680px] rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-bold text-mint-dark"
                >
                  ¡Tu cuenta ya está creada! Revisa tu correo y confirma la dirección para poder
                  entrar.
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M2 12C3.8 8.5 7.4 6 12 6C16.6 6 20.2 8.5 22 12C20.2 15.5 16.6 18 12 18C7.4 18 3.8 15.5 2 12Z"
                            stroke="#8B82A6"
                            strokeWidth="2.2"
                          />
                          <circle cx="12" cy="12" r="3" stroke="#8B82A6" strokeWidth="2.2" />
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
                      disabled={loading || awaitingProfile}
                      className="btn btn-sun mx-auto block w-full max-w-[360px]"
                    >
                      {loading || awaitingProfile ? 'Registrando...' : 'Registrarte'}
                    </button>
                  </div>
                </form>

                <div className="card-flat relative overflow-hidden bg-cream p-4 sm:p-5">
                  <TropicalFlower
                    size={40}
                    className="pointer-events-none absolute -right-3 -top-3 rotate-[14deg]"
                    color="#FF8A3D"
                  />

                  {/* Hueco reservado para la ilustración de la mascota. */}
                  <div className="relative flex h-[196px] items-center justify-center rounded-[18px] border-[3px] border-dashed border-line bg-white font-display text-[14px] text-ink-faint">
                    Imagen Registro
                  </div>

                  <div className="mt-6 flex items-center gap-3 text-[13px] font-bold text-ink-faint">
                    <span className="h-[3px] flex-1 rounded-full bg-line" />
                    <span>O ingresa con</span>
                    <span className="h-[3px] flex-1 rounded-full bg-line" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="mt-5 flex h-[52px] w-full items-center justify-center gap-3 rounded-full border-[3px] border-ink bg-white px-5 font-display text-[16px] text-ink shadow-[0_4px_0_rgba(42,27,69,0.15)] transition-transform active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    <GoogleMark />
                    <span>Continuar con Google</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center text-[15px] font-bold text-ink-soft">
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="font-display text-grape-dark hover:underline"
                  >
                    Inicia sesión
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="btn btn-sm btn-ghost mt-4"
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
