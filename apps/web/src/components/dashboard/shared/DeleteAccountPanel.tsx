import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Borrar la cuenta propia desde Ajustes, para quien se equivocó al darse de alta.
 *
 * Vive en `shared/` como los otros dos paneles de cuenta: lo montan las dos
 * pantallas de Ajustes. El aviso cambia con el rol porque al tutor se le van
 * también sus salones, y a sus alumnos con ellos.
 */
export const DeleteAccountPanel = () => {
  const navigate = useNavigate();
  const { deleteAccount, error, user } = useAuth();

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /* El error del contexto es de todos los paneles de Ajustes: sólo se enseña aquí si es de éste. */
  const [failed, setFailed] = useState(false);

  const isTutor = user?.role === 'tutor';

  const handleConfirm = async (): Promise<void> => {
    setConfirming(false);
    setFailed(false);
    setDeleting(true);

    const deleted = await deleteAccount();

    setDeleting(false);
    setFailed(!deleted);

    if (deleted) {
      endGuestSession();
      navigate(ROUTES.LANDING, { replace: true });
    }
  };

  return (
    <div className="mt-6 border-t-[3px] border-line pt-6">
      <h3 className="font-display text-[19px] text-coral-dark">Eliminar cuenta</h3>
      <p className="mt-1 max-w-[520px] text-[15px] font-semibold leading-[1.6] text-ink-soft">
        {isTutor
          ? 'Se borran tu cuenta y tus salones. Tus alumnos quedarán sin salón.'
          : 'Se borran tu cuenta, tu progreso y tus logros.'}{' '}
        No se puede deshacer.
      </p>

      {failed && error ? (
        <p
          role="alert"
          className="mt-4 max-w-[520px] rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark"
        >
          {error.message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={deleting}
        className="btn btn-coral mt-4 disabled:opacity-60"
      >
        {deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
      </button>

      {confirming ? (
        <ConfirmDialog
          title="¿Eliminar tu cuenta?"
          confirmLabel="Sí, eliminarla"
          onConfirm={() => void handleConfirm()}
          onCancel={() => setConfirming(false)}
        >
          {isTutor
            ? 'Se borrarán tu cuenta y todos tus salones. Esto no se puede deshacer.'
            : 'Se borrarán tu cuenta, tu progreso y tus logros. Esto no se puede deshacer.'}
        </ConfirmDialog>
      ) : null}
    </div>
  );
};
