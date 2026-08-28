import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { resetPasswordSchema } from '../../components/auth/ChangePasswordForm.schema';
import { SignupField } from '../../components/auth/SignupField';
import { Canopy, TropicalFlower } from '../../components/decor/JungleDecor';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useRoleHomeRedirect } from '../../hooks/useRoleHomeRedirect';

/**
 * Pantalla a la que lleva el enlace del correo.
 *
 * NO pide la contraseña actual: quien llega aquí es exactamente quien no la
 * sabe, así que pedírsela sería exigirle el dato que vino a recuperar. Por eso
 * usa `resetPasswordSchema` y `updatePassword()`, y no el par de Ajustes.
 *
 * Tampoco monta `ChangePasswordPanel`: vive fuera del panel, con el marco de las
 * pantallas de acceso. Lo que comparte con Ajustes es la regla de las dos
 * contraseñas nuevas, no el marcado.
 */
export const ResetPassword = () => {
  const { clearError, error, updatePassword } = useAuth();
  const { awaitingProfile, start } = useRoleHomeRedirect();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const displayedError = formError ?? error?.message ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);

    const parsedForm = resetPasswordSchema.safeParse({ confirmPassword, password });

    if (!parsedForm.success) {
      setFormError(parsedForm.error.issues[0]?.message ?? 'Revisa los datos del formulario.');
      return;
    }

    setSaving(true);
    const didUpdate = await updatePassword(password);
    setSaving(false);

    // El enlace ya abrió sesión, así que desde aquí se entra directo al panel
    // que corresponda al rol del perfil.
    if (didUpdate) {
      start();
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
            <TropicalFlower
              size={48}
              className="pointer-events-none absolute -right-4 -top-4 rotate-[14deg]"
              color="#FF8A3D"
            />

            <div className="relative">
              <span className="chip chip-papaya">Última parada</span>

              <h1 className="title-xl mt-3">Crea tu contraseña nueva</h1>
              <p className="subtitle mt-1">Elígela y vuelves a tu aventura.</p>

              {displayedError ? (
                <p
                  role="alert"
                  className="mt-6 rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark"
                >
                  {displayedError}
                </p>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <SignupField
                  label="Contraseña nueva"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu clave secreta nueva"
                  autoComplete="new-password"
                  required
                />

                <SignupField
                  label="Repite la contraseña nueva"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Otra vez, para estar seguros"
                  autoComplete="new-password"
                  required
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving || awaitingProfile}
                    className="btn btn-grape w-full"
                  >
                    {saving || awaitingProfile ? 'Guardando...' : 'Guardar y entrar'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
