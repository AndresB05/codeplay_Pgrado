import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { ClassGroup } from '../../../types/classroom.types';
import { formatRelativeTime } from './classroomsData';

interface PendingRequestsSectionProps {
  group: ClassGroup;
  freeSeats: number;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

/**
 * Bandeja de solicitudes de ingreso de un salón concreto. El tutor acepta o
 * rechaza; al aceptar, el niño pasa a la tabla de seguimiento.
 */
export const PendingRequestsSection = ({
  group,
  freeSeats,
  onAccept,
  onReject,
}: PendingRequestsSectionProps) => {
  const requests = group.pendingRequests;
  const noSeatsLeft = freeSeats === 0;

  return (
    <section className="tutor-card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-tutor-rule px-4 py-3">
        <h2 className="text-[17px] leading-tight text-tutor-ink">Alumnos en espera</h2>

        {requests.length > 0 ? (
          <span className="tutor-badge tutor-badge-warn">{requests.length} en espera</span>
        ) : null}

        <p className="ml-auto text-[13.5px] text-tutor-ink-soft">
          Solicitudes de ingreso a {group.name}
        </p>
      </header>

      {requests.length === 0 ? (
        <p className="px-4 py-6 text-center text-tutor-ink-soft">
          No hay solicitudes pendientes ahora mismo.
        </p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-tutor-rule px-4 py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <img
                  src={pickMascotAvatar(request.studentId, request.studentName)}
                  alt=""
                  className="h-[30px] w-[30px] shrink-0 rounded-full border border-tutor-rule object-cover"
                />

                <p className="min-w-0">
                  <span className="font-semibold text-tutor-ink">{request.studentName}</span>{' '}
                  <span className="text-[14px] text-tutor-ink-soft">
                    · solicitó {formatRelativeTime(request.requestedAtIso)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAccept(request.id)}
                  disabled={noSeatsLeft}
                  title={noSeatsLeft ? 'El salón no tiene cupos libres' : undefined}
                  className="tutor-btn tutor-btn-primary tutor-btn-sm"
                >
                  Aceptar
                </button>

                <button
                  type="button"
                  onClick={() => onReject(request.id)}
                  className="tutor-btn tutor-btn-secondary tutor-btn-sm"
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {noSeatsLeft && requests.length > 0 ? (
        <p className="border-t border-tutor-rule bg-tutor-danger-soft px-4 py-2.5 text-[14.5px] font-semibold text-tutor-danger">
          El salón está lleno. Quita a algún explorador o amplía los cupos para aceptar más.
        </p>
      ) : null}
    </section>
  );
};
