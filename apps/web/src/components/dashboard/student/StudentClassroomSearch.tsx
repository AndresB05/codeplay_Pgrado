import { useMemo, useState } from 'react';
import type { ClassGroup } from '../../../types/classroom.types';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { isExactIdSearch, matchesGroupSearch } from '../teacher/classroomsData';

interface StudentClassroomSearchProps {
  groups: ClassGroup[];
  onRequestJoin: (groupId: string) => void;
}

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="6.5" fill="#FFF9EF" stroke="#2A1B45" strokeWidth="2.4" />
    <path d="M16 16L20.5 20.5" stroke="#2A1B45" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

const CompassIcon = () => (
  <svg width="72" height="72" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" fill="#FFC93C" stroke="#2A1B45" strokeWidth="3.5" />
    <path
      d="M24 40L28.5 28.5L40 24L35.5 35.5L24 40Z"
      fill="#FFFFFF"
      stroke="#2A1B45"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="32" r="2.6" fill="#2A1B45" />
  </svg>
);

/**
 * Buscador de salones para el niño que todavía no pertenece a ninguno.
 * Busca por nombre dentro del listado global y también por ID exacto, en cuyo
 * caso se muestra únicamente ese salón.
 */
export const StudentClassroomSearch = ({ groups, onRequestJoin }: StudentClassroomSearchProps) => {
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => groups.filter((group) => matchesGroupSearch(group, query)),
    [groups, query]
  );

  const foundById = isExactIdSearch(groups, query);

  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden px-6 py-6">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-sun-soft" />
        <span className="pointer-events-none absolute right-24 top-16 h-12 w-12 rounded-full bg-grape-soft" />

        <div className="relative flex flex-wrap items-center gap-5">
          <CompassIcon />

          <div className="min-w-[260px] flex-1">
            <h1 className="title-xl">¡Todavía no estás en ningún salón!</h1>
            <p className="subtitle mt-1">
              Busca el salón de tu clase por su nombre, o escribe el ID exacto que te dio tu
              profesor.
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <label htmlFor="classroom-search" className="sr-only">
            Buscar salón por nombre o ID
          </label>

          <div className="flex items-center gap-3 rounded-full border-[3px] border-ink bg-cream px-5 py-1 shadow-[0_5px_0_rgba(42,27,69,0.12)]">
            <SearchIcon />
            <input
              id="classroom-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Salón 1A  ·  CP-1A24"
              className="h-[52px] flex-1 bg-transparent text-[17px] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-ink-faint"
            />
            {query.length > 0 ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full bg-grape-soft px-4 py-1.5 font-display text-[14px] text-grape-dark"
              >
                Limpiar
              </button>
            ) : null}
          </div>

          {foundById ? (
            <p className="mt-3 inline-flex rounded-full bg-mint-soft px-4 py-1.5 font-display text-[14px] text-mint-dark">
              ¡Encontrado por ID de salón!
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-7 pb-4">
        <h2 className="title-lg">
          {query.trim().length > 0
            ? `${results.length} resultado${results.length === 1 ? '' : 's'}`
            : 'Salones disponibles'}
        </h2>

        {results.length === 0 ? (
          <p className="card mt-4 px-5 py-12 text-center text-[16px] font-semibold text-ink-faint">
            Ningún salón coincide con «{query.trim()}». Revisa el nombre o pídele el ID a tu
            profesor.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {results.map((group) => {
              const freeSeats = Math.max(group.capacity - group.memberCount, 0);
              const isFull = freeSeats === 0;
              const theme = getGroupTheme(group.id);

              return (
                <article key={group.id} className="card overflow-hidden">
                  <div
                    className="relative flex items-center gap-4 border-b-[3px] border-ink px-5 py-4"
                    style={{ background: theme.gradient }}
                  >
                    <span className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/25" />

                    <GroupBadge theme={theme} />

                    <div className="relative min-w-0">
                      <h3 className="font-display text-[24px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
                        {group.name}
                      </h3>
                      <p className="text-[15px] font-bold text-white/90">{group.gradeLabel}</p>
                    </div>

                    <span className="relative ml-auto shrink-0 rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-[13px] tracking-[0.04em] text-ink">
                      {group.publicId}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-[16px] font-bold text-ink">
                      Profesor <span className="text-mint-dark">{group.teacherName}</span>
                    </p>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[14px] font-bold text-ink-soft">
                        <span>
                          {group.memberCount} de {group.capacity} cupos
                        </span>
                        <span>{freeSeats} libres</span>
                      </div>

                      <div className="mt-1.5 h-[14px] w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((group.memberCount / group.capacity) * 100, 100)}%`,
                            background: theme.color,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRequestJoin(group.id)}
                      disabled={isFull}
                      className="btn btn-grape mt-4 w-full"
                    >
                      {isFull ? 'Salón lleno' : 'Solicitar ingreso'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
