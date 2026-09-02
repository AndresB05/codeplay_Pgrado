import { useState } from 'react';
import { ROUTES } from '../../../constants/routes';
import { useInvitations } from '../../../hooks/useInvitations';
import type { Invitation, InvitationState } from '../../../services/invitations.service';
import type { ClassGroup } from '../../../types/classroom.types';

interface AddStudentsPanelProps {
  group: ClassGroup;
  freeSeats: number;
}

const IdCardIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="2.5"
      y="5"
      width="19"
      height="14"
      rx="3"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
    />
    <circle cx="8.5" cy="11" r="2.2" stroke="#2A1B45" strokeWidth="2" />
    <path
      d="M5.5 16.2C6.2 14.9 7.3 14.3 8.5 14.3C9.7 14.3 10.8 14.9 11.5 16.2M14 10H18.5M14 13.5H17"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/** Enlace absoluto que el tutor comparte por donde quiera. */
const buildInviteUrl = (token: string): string =>
  `${window.location.origin}${ROUTES.INVITE}/${token}`;

/*
 * TRES estados y no dos. El panel anterior a `invitaciones-sin-correo` pintaba
 * `status === 'pending' ? 'Pendiente' : 'Aceptada'`, con lo que un enlace
 * caducado salía como «Aceptada»: le diría al tutor que puede compartir algo
 * que no va a funcionar.
 */
const STATE_LABELS: Record<InvitationState, string> = {
  valid: 'Activo',
  used: 'Usado',
  expired: 'Caducado',
};

const STATE_CHIPS: Record<InvitationState, string> = {
  valid: 'chip chip-leaf',
  used: 'chip chip-mint',
  expired: 'chip chip-coral',
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });

/**
 * Las dos vías por las que hoy entra un alumno al salón: el ID público, que
 * sirve para todo un curso y pasa por la bandeja de solicitudes, y el enlace de
 * invitación, que mete a UNO directamente porque el tutor ya consintió al
 * generarlo.
 *
 * Antes había aquí un formulario de invitación por correo que no enviaba ningún
 * correo y que guardaba la dirección de un tercero sin cuenta. Ver el cambio
 * `invitaciones-sin-correo`: **el envío sigue sin existir**, y este enlace lo
 * comparte el tutor por donde quiera. Ninguna dirección se pide ni se guarda.
 */
export const AddStudentsPanel = ({ group, freeSeats }: AddStudentsPanelProps) => {
  const { create, error, invitations, loading, revoke } = useInvitations(group.id);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = async (invitation: Invitation): Promise<void> => {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(invitation.token));
      setCopiedToken(invitation.token);
    } catch {
      /*
       * El portapapeles puede estar denegado por el navegador. No es un fallo
       * del salón, así que no se pinta como error: el enlace se ve entero en
       * pantalla y se puede seleccionar a mano.
       */
      setCopiedToken(null);
    }
  };

  const handleCreate = async (): Promise<void> => {
    const created = await create();

    if (created) {
      void handleCopy(created);
    }
  };

  return (
    <section className="card px-6 py-5">
      <div className="flex items-center gap-3">
        <IdCardIcon />
        <h2 className="font-display text-[20px] text-ink">Suma exploradores a {group.name}</h2>
      </div>

      <p className="subtitle mt-2">
        Comparte el ID del salón con la familia o con el alumno. Quedan {freeSeats} cupos libres.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border-2 border-line bg-cream px-4 py-3">
        <span className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
          ID del salón
        </span>
        <span className="font-display text-[26px] tracking-[0.06em] text-grape-dark">
          {group.publicId}
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        <li className="flex gap-3">
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-[15px] text-ink">
            1
          </span>
          <p className="text-[16px] font-semibold text-ink-soft">
            El alumno entra en <strong className="text-ink">Mi salón</strong> y busca ese ID.
          </p>
        </li>

        <li className="flex gap-3">
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-[15px] text-ink">
            2
          </span>
          <p className="text-[16px] font-semibold text-ink-soft">
            Pulsa <strong className="text-ink">Solicitar ingreso</strong> y queda en espera.
          </p>
        </li>

        <li className="flex gap-3">
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-[15px] text-ink">
            3
          </span>
          <p className="text-[16px] font-semibold text-ink-soft">
            Su solicitud aparece aquí, en <strong className="text-ink">Alumnos en espera</strong>, y
            tú la aceptas.
          </p>
        </li>
      </ol>

      <div className="mt-6 border-t-2 border-line pt-5">
        <h3 className="font-display text-[17px] text-ink">O envíale un enlace directo</h3>
        <p className="subtitle mt-1">
          Quien abra el enlace entra al salón sin que tengas que aceptarlo. Sirve una sola vez y
          caduca a los 14 días. Compártelo tú: nosotros no enviamos correos.
        </p>

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="btn btn-sun btn-sm mt-4"
        >
          Generar enlace
        </button>

        {error ? (
          <p className="mt-4 rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark">
            {error.message}
          </p>
        ) : null}

        {invitations.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="rounded-[18px] border-2 border-line bg-cream px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={STATE_CHIPS[invitation.state]}>
                    {STATE_LABELS[invitation.state]}
                  </span>
                  <span className="text-[13px] font-bold text-ink-faint">
                    {invitation.state === 'used'
                      ? `Usado el ${formatDate(invitation.acceptedAt ?? invitation.sentAt)}`
                      : `Caduca el ${formatDate(invitation.expiresAt)}`}
                  </span>
                </div>

                <p className="mt-2 break-all text-[14px] font-semibold text-ink-soft">
                  {buildInviteUrl(invitation.token)}
                </p>

                {invitation.state === 'valid' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopy(invitation)}
                      className="btn btn-ghost btn-sm"
                    >
                      {copiedToken === invitation.token ? '¡Copiado!' : 'Copiar enlace'}
                    </button>

                    <button
                      type="button"
                      onClick={() => void revoke(invitation.id)}
                      className="btn btn-ghost btn-sm"
                    >
                      Retirar
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
};
