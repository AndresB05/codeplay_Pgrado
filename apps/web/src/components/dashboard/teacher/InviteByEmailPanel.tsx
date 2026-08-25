import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ClassGroup } from '../../../types/classroom.types';
import { formatRelativeTime } from './classroomsData';

interface InviteByEmailPanelProps {
  group: ClassGroup;
  freeSeats: number;
  onInvite: (email: string) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const EnvelopeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <path
      d="M3.5 7L12 13L20.5 7"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Invitación por correo. Sustituye al código que el niño tenía que teclear:
 * ahora el tutor manda un enlace que lleva directo al salón.
 */
export const InviteByEmailPanel = ({ group, freeSeats, onInvite }: InviteByEmailPanelProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = email.trim();

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Escribe un correo electrónico válido.');
      return;
    }

    const alreadyInvited = group.invitations.some(
      (invitation) => invitation.email === trimmed.toLowerCase()
    );

    if (alreadyInvited) {
      setError('Ya enviaste una invitación a ese correo.');
      return;
    }

    onInvite(trimmed);
    setSentTo(trimmed);
    setEmail('');
    setError(null);
  };

  return (
    <section className="card px-6 py-5">
      <div className="flex items-center gap-3">
        <EnvelopeIcon />
        <h2 className="font-display text-[20px] text-ink">Invitar exploradores a {group.name}</h2>
      </div>

      <p className="subtitle mt-2">
        Escribe el correo del alumno y recibirá un enlace que lo lleva directamente a este salón,
        sin teclear ningún código. Quedan {freeSeats} cupos libres.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-start gap-3">
        <div className="min-w-[260px] flex-1">
          <label htmlFor="invite-email" className="sr-only">
            Correo del alumno
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            placeholder="alumno@correo.com"
            className="field"
          />
          {error ? (
            <p className="mt-2 px-2 text-[14px] font-bold text-coral-dark">{error}</p>
          ) : null}
        </div>

        <button type="submit" className="btn btn-grape">
          Enviar invitación
        </button>
      </form>

      {sentTo ? (
        <p className="mt-3 rounded-[16px] border-2 border-mint-dark bg-mint-soft px-4 py-3 text-[15px] font-semibold text-mint-dark">
          Invitación registrada para <strong>{sentTo}</strong>. El envío real de correos todavía no
          está conectado: esto es la interfaz del prototipo.
        </p>
      ) : null}

      {group.invitations.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
            Invitaciones enviadas
          </h3>

          <ul className="mt-3 space-y-2">
            {group.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border-2 border-line bg-cream px-4 py-3"
              >
                <div>
                  <p className="text-[16px] font-bold text-ink">{invitation.email}</p>
                  <p className="text-[14px] font-semibold text-ink-faint">
                    Enviada {formatRelativeTime(invitation.sentAtIso)}
                  </p>
                </div>

                <span className="chip chip-sun">
                  {invitation.status === 'pending' ? 'Pendiente' : 'Aceptada'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};
