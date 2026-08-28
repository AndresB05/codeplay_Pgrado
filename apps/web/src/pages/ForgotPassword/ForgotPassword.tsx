import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupField } from '../../components/auth/SignupField';
import { Canopy, MonsteraLeaf } from '../../components/decor/JungleDecor';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { clearError, error, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);

  const displayedError = formError ?? error?.message ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);

    if (!email.includes('@')) {
      setFormError('Escribe un correo electrónico válido.');
      return;
    }

    setSending(true);
    const didRequest = await requestPasswordReset(email);
    setSending(false);

    if (didRequest) {
      setRequested(true);
    }
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
          <section className="card relative w-full max-w-[560px] overflow-hidden px-7 pb-9 pt-8 sm:px-10">
            <MonsteraLeaf
              size={96}
              className="pointer-events-none absolute -right-7 -top-8 rotate-[18deg] opacity-70"
              color="#12703D"
            />

            <div className="relative">
              <span className="chip chip-leaf">Te ayudamos a volver</span>

              <h1 className="title-xl mt-3">¿Olvidaste tu contraseña?</h1>
              <p className="subtitle mt-1">
                Escribe tu correo y te mandamos un enlace para crear una nueva.
              </p>

              {displayedError ? (
                <p
                  role="alert"
                  className="mt-6 rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark"
                >
                  {displayedError}
                </p>
              ) : null}

              {/*
               * El aviso es el mismo exista o no la cuenta. Supabase responde
               * igual en los dos casos a propósito, y cambiar el texto aquí
               * convertiría la pantalla en un comprobador de quién está dado de
               * alta.
               */}
              {requested ? (
                <p
                  role="status"
                  className="mt-6 rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-bold text-mint-dark"
                >
                  Si ese correo tiene una cuenta en CodePlay, le acabamos de enviar un enlace.
                  Revisa la bandeja de entrada.
                </p>
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
                />

                <div className="pt-2">
                  <button type="submit" disabled={sending} className="btn btn-grape w-full">
                    {sending ? 'Enviando...' : 'Enviar el enlace'}
                  </button>
                </div>
              </form>

              <p className="mt-7 text-center text-[15px] font-bold text-ink-soft">
                ¿Ya la recordaste?{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="font-display text-grape-dark hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
