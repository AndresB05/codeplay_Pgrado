import type { ClassGroup } from '../../../types/classroom.types';
import { formatRelativeTime } from './classroomsData';

const HandIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 11V5.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V12m0-1a1.5 1.5 0 013 0v4.5c0 3-2.4 5.5-5.5 5.5h-1a5.5 5.5 0 01-5.5-5.5V9.5a1.5 1.5 0 013 0V13"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

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
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink bg-sun-soft px-5 py-4">
        <div className="flex items-center gap-3">
          <HandIcon />
          <h2 className="font-display text-[20px] text-ink">Alumnos en espera</h2>

          {requests.length > 0 ? (
            <span className="rounded-full border-2 border-ink bg-sun px-3 py-0.5 font-display text-[14px] text-ink">
              {requests.length}
            </span>
          ) : null}
        </div>

        <p className="text-[14px] font-bold text-sun-dark">Solicitudes de ingreso a {group.name}</p>
      </header>

      {requests.length === 0 ? (
        <p className="px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
          No hay solicitudes pendientes ahora mismo.
        </p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-line px-5 py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] border-ink font-display text-[15px] ${request.avatarTone}`}
                >
                  {request.initials}
                </div>

                <div>
                  <p className="text-[16px] font-bold text-ink">{request.studentName}</p>
                  <p className="text-[14px] font-semibold text-ink-faint">
                    Solicitó {formatRelativeTime(request.requestedAtIso)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAccept(request.id)}
                  disabled={noSeatsLeft}
                  title={noSeatsLeft ? 'El salón no tiene cupos libres' : undefined}
                  className="btn btn-sm btn-mint"
                >
                  Aceptar
                </button>

                <button
                  type="button"
                  onClick={() => onReject(request.id)}
                  className="btn btn-sm btn-coral"
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {noSeatsLeft && requests.length > 0 ? (
        <p className="border-t-2 border-line bg-coral-soft px-5 py-3 text-[15px] font-bold text-coral-dark">
          El salón está lleno. Quita a algún explorador o amplía los cupos para aceptar más.
        </p>
      ) : null}
    </section>
  );
};
