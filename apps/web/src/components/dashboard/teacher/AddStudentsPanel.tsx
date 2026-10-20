import { useState } from 'react';
import { ROUTES } from '../../../constants/routes';
import { useInvitations } from '../../../hooks/useInvitations';
import type { Invitation, InvitationState } from '../../../services/invitations.service';
import type { ClassGroup } from '../../../types/classroom.types';

interface AddStudentsPanelProps {
  group: ClassGroup;
  freeSeats: number;
}

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

const STATE_BADGES: Record<InvitationState, string> = {
  valid: 'tutor-badge tutor-badge-ok',
  used: 'tutor-badge tutor-badge-mute',
  expired: 'tutor-badge tutor-badge-danger',
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
    <section className="tutor-card px-5 py-5">
      <h2 className="text-[19px] leading-tight text-tutor-ink">Suma exploradores a {group.name}</h2>

      <p className="mt-1 text-tutor-ink-soft">
        Comparte el ID del salón con la familia o con el alumno. Quedan {freeSeats} cupos libres.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-baseline gap-3 rounded-[8px] border border-tutor-rule bg-tutor-sunken px-4 py-3">
            <span className="text-[13.5px] font-medium text-tutor-ink-soft">ID del salón</span>
            <span className="text-[22px] font-bold tracking-[0.06em] text-tutor-accent">
              {group.publicId}
            </span>
          </div>

          <ol className="mt-4 space-y-2.5">
            {[
              <>
                El alumno entra en <strong className="font-semibold text-tutor-ink">Mi salón</strong> y
                busca ese ID.
              </>,
              <>
                Pulsa <strong className="font-semibold text-tutor-ink">Solicitar ingreso</strong> y
                queda en espera.
              </>,
              <>
                Su solicitud aparece aquí, en{' '}
                <strong className="font-semibold text-tutor-ink">Alumnos en espera</strong>, y tú la
                aceptas.
              </>,
            ].map((step, index) => (
              <li key={index} className="flex gap-2.5">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-tutor-accent-soft text-[13px] font-semibold text-tutor-accent">
                  {index + 1}
                </span>
                <p className="text-tutor-ink-soft">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-tutor-rule pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <h3 className="text-[16px] leading-tight text-tutor-ink">O envíale un enlace directo</h3>
          <p className="mt-1 text-[14.5px] text-tutor-ink-soft">
            Quien abra el enlace entra al salón sin que tengas que aceptarlo. Sirve una sola vez y
            caduca a los 14 días. Compártelo tú: nosotros no enviamos correos.
          </p>

          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="tutor-btn tutor-btn-secondary tutor-btn-sm mt-3"
          >
            Generar enlace
          </button>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-[8px] border border-tutor-danger/30 bg-tutor-danger-soft px-4 py-2.5 text-[14.5px] font-semibold text-tutor-danger"
            >
              {error.message}
            </p>
          ) : null}

          {invitations.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="rounded-[8px] border border-tutor-rule px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={STATE_BADGES[invitation.state]}>
                      {STATE_LABELS[invitation.state]}
                    </span>
                    <span className="text-[13px] text-tutor-ink-soft">
                      {invitation.state === 'used'
                        ? `Usado el ${formatDate(invitation.acceptedAt ?? invitation.sentAt)}`
                        : `Caduca el ${formatDate(invitation.expiresAt)}`}
                    </span>
                  </div>

                  <p className="mt-1.5 break-all text-[13.5px] text-tutor-ink-soft">
                    {buildInviteUrl(invitation.token)}
                  </p>

                  {invitation.state === 'valid' ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleCopy(invitation)}
                        className="tutor-btn tutor-btn-secondary tutor-btn-sm"
                      >
                        {copiedToken === invitation.token ? '¡Copiado!' : 'Copiar enlace'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void revoke(invitation.id)}
                        className="tutor-btn tutor-btn-ghost tutor-btn-sm"
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
      </div>
    </section>
  );
};
