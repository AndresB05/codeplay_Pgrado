import { useState } from 'react';
import type { FormEvent } from 'react';
import { changePasswordSchema } from '../../auth/ChangePasswordForm.schema';
import { SignupField } from '../../auth/SignupField';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Cambio de contraseña desde Ajustes.
 *
 * Lo montan las dos pantallas de Ajustes, que tienen marcos distintos pero el
 * mismo formulario. Dos copias divergirían al primer arreglo, como pasó con el
 * `signOut` de las dos barras laterales.
 *
 * Pide la contraseña actual y el servicio la verifica contra el servidor:
 * `updateUser` no la exige, pero esto se usa en computadores de aula
 * compartidos, donde quien se siente ante la sesión de un compañero podría
 * dejarlo fuera de su cuenta.
 */
export const ChangePasswordPanel = () => {
  const { changePassword, clearError, error } = useAuth();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const displayedError = formError ?? error?.message ?? null;

  const reset = (): void => {
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
  };

  const handleToggle = (): void => {
    clearError();
    reset();
    setChanged(false);
    setOpen((current) => !current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);
    setChanged(false);

    const parsedForm = changePasswordSchema.safeParse({
      confirmPassword,
      currentPassword,
      password,
    });

    if (!parsedForm.success) {
      setFormError(parsedForm.error.issues[0]?.message ?? 'Revisa los datos del formulario.');
      return;
    }

    setSubmitting(true);
    const didChange = await changePassword(currentPassword, password);
    setSubmitting(false);

    if (didChange) {
      reset();
      setChanged(true);
    }
  };

  return (
    <div className="mt-6">
      <button type="button" onClick={handleToggle} className="btn btn-ghost">
        {open ? 'Cancelar' : 'Cambiar contraseña'}
      </button>

      {changed && !open ? (
        <p
          role="status"
          className="mt-4 rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-bold text-mint-dark"
        >
          Tu contraseña quedó cambiada. Úsala la próxima vez que entres.
        </p>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-5 max-w-[420px] space-y-4">
          {displayedError ? (
            <p
              role="alert"
              className="rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark"
            >
              {displayedError}
            </p>
          ) : null}

          {changed ? (
            <p
              role="status"
              className="rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-bold text-mint-dark"
            >
              Tu contraseña quedó cambiada. Úsala la próxima vez que entres.
            </p>
          ) : null}

          <SignupField
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="La que usas ahora"
            autoComplete="current-password"
            required
          />

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

          <button type="submit" disabled={submitting} className="btn btn-grape">
            {submitting ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      ) : null}
    </div>
  );
};
