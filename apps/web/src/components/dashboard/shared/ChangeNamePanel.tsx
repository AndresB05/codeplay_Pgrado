import { useState } from 'react';
import type { FormEvent } from 'react';
import { fullNameSchema } from '../../auth/fullName.schema';
import { SignupField } from '../../auth/SignupField';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Cambio del nombre desde Ajustes.
 *
 * Vive en `shared/` por lo mismo que `ChangePasswordPanel`: lo montan las dos
 * pantallas de Ajustes, que tienen marcos distintos y el mismo formulario.
 *
 * Escribe por `useAuth()` y no por `useProfile()`, que también sabe hacerlo: el
 * nombre se lee del provider de sesión en siete sitios, y `useProfile` mantiene
 * su propia copia. Ver `AuthContext.ts`.
 *
 * A diferencia del panel de contraseña, el campo arranca con el valor actual: un
 * nombre casi siempre se corrige, no se reinventa.
 */
export const ChangeNamePanel = () => {
  const { clearError, error, updateFullName, user } = useAuth();

  const currentName = user?.fullName ?? '';

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState(currentName);
  const [formError, setFormError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const displayedError = formError ?? error?.message ?? null;

  const handleToggle = (): void => {
    clearError();
    setFullName(currentName);
    setFormError(null);
    setChanged(false);
    setOpen((current) => !current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);
    setChanged(false);

    const parsedName = fullNameSchema.safeParse(fullName);

    if (!parsedName.success) {
      setFormError(parsedName.error.issues[0]?.message ?? 'Revisa el nombre.');
      return;
    }

    setSubmitting(true);
    // Se envía el valor del esquema, que ya viene recortado.
    const didChange = await updateFullName(parsedName.data);
    setSubmitting(false);

    if (didChange) {
      setFullName(parsedName.data);
      setChanged(true);
    }
  };

  return (
    <div className="mt-6">
      <button type="button" onClick={handleToggle} className="btn btn-ghost">
        {open ? 'Cancelar' : 'Cambiar nombre'}
      </button>

      {changed && !open ? (
        <p
          role="status"
          className="mt-4 rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-bold text-mint-dark"
        >
          Tu nombre quedó cambiado. Así te verán en tus salones.
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
              Tu nombre quedó cambiado. Así te verán en tus salones.
            </p>
          ) : null}

          <SignupField
            label="Nombre"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Cómo quieres que te llamen"
            autoComplete="name"
            required
          />

          <button type="submit" disabled={submitting} className="btn btn-grape">
            {submitting ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      ) : null}
    </div>
  );
};
