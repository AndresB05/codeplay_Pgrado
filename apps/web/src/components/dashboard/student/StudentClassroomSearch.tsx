import { useMemo, useState } from 'react';
import compassRose from '../../../assets/brand/classroom-compass.webp';
import routeX from '../../../assets/brand/route-x.webp';
import searchLeopard from '../../../assets/brand/classroom-search-leopard-ink.webp';
import type { ClassGroup } from '../../../types/classroom.types';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { TILT_ON_HOVER, pickTilt } from '../shared/pickTilt';
import { isExactIdSearch, matchesGroupSearch } from '../teacher/classroomsData';

interface StudentClassroomSearchProps {
  groups: ClassGroup[];
  onRequestJoin: (groupId: string) => void;
}

const SearchIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" />
    <path d="M16 16L20.5 20.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

/*
 * Las líneas de cada salón, intercaladas en dos tonos como las filas de la tabla
 * del salón por dentro: el nombre queda en claro y la raya punteada las separa
 * salvo a la última.
 */
const BAND_COUNT = 4;

const band = (index: number) =>
  `-mx-3 px-3 py-3 ${index % 2 === 1 ? 'bg-sepia-soft/15' : ''} ${
    index < BAND_COUNT - 1 ? 'border-b-2 border-dashed border-sepia-soft/50' : ''
  }`;

const ArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 12.5C9 11.5 14 12 19 12M14 7L19.5 12L14 17"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
      {/*
       * La misma cartela de tinta que encabeza el salón: el niño ya está sobre el
       * mapa, aunque todavía no tenga salón en él.
       */}
      <section className="relative isolate flex flex-wrap items-center gap-6 px-16 py-7">
        <div
          aria-hidden
          className="classroom-cartouche pointer-events-none absolute inset-0 -z-10"
        />

        <img
          src={searchLeopard}
          alt=""
          aria-hidden
          className="pointer-events-none h-[200px] w-auto shrink-0"
        />

        <img
          src={compassRose}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-[84px] top-[26px] hidden h-[64px] w-[64px] opacity-45 md:block"
        />

        <div className="relative min-w-[260px] flex-1">
          <h1 className="map-title font-display text-[34px] leading-tight text-sepia">
            ¡Todavía no estás en ningún salón!
          </h1>
          <p className="font-map text-[19px] text-sepia-soft">
            Busca el salón de tu clase por su nombre, o escribe el ID exacto que te dio tu tutor.
          </p>

          <label htmlFor="classroom-search" className="sr-only">
            Buscar salón por nombre o ID
          </label>

          <div className="note-paper mt-4 flex items-center gap-3 px-3 text-sepia focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-grape-dark">
            <SearchIcon />
            <input
              id="classroom-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Salón 1A  ·  CP-1A24"
              className="h-[44px] flex-1 bg-transparent font-map text-[21px] text-sepia outline-none placeholder:text-sepia-soft/70"
            />
            {query.length > 0 ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full border-2 border-dashed border-sepia-soft px-4 py-0.5 font-map text-[17px] text-sepia"
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
        <h2 className="font-map text-[32px] font-bold leading-tight text-sepia">
          {query.trim().length > 0
            ? `${results.length} resultado${results.length === 1 ? '' : 's'}`
            : 'Salones disponibles'}
        </h2>

        {results.length === 0 ? (
          /* El rollo del podio y no el mapa de las tarjetas: estirado a lo ancho, el mapa se deformaba. */
          <p className="podium-scroll mx-auto mt-4 max-w-[760px] px-4 py-2 text-center font-map text-[20px] text-sepia-soft">
            Ningún salón coincide con «{query.trim()}». Revisa el nombre o pídele el ID a tu tutor.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {results.map((group) => {
              const freeSeats = Math.max(group.capacity - group.memberCount, 0);
              const isFull = freeSeats === 0;
              const theme = getGroupTheme(group.id);
              const filled = Math.min((group.memberCount / group.capacity) * 100, 100);

              /*
               * Cada salón, un pergamino como los del salón por dentro: el color
               * que eligió el tutor sobrevive sólo en el sello.
               */
              return (
                <article
                  key={group.id}
                  onMouseEnter={pickTilt}
                  className={`relative isolate px-12 pb-10 pt-8 ${TILT_ON_HOVER}`}
                >
                  <div
                    aria-hidden
                    className="map-sheet pointer-events-none absolute inset-0 -z-10"
                  />

                  <div className={`${band(0)} flex items-center gap-4`}>
                    <GroupBadge theme={theme} size={60} shape="seal" />

                    <div className="min-w-0">
                      <h3 className="map-title break-words font-display text-[26px] leading-tight text-sepia">
                        {group.name}
                      </h3>
                      <p className="font-map text-[18px] text-sepia-soft">{group.gradeLabel}</p>
                    </div>

                    <span className="ml-auto shrink-0 rotate-[3deg] rounded-md border-[3px] border-double border-sepia px-2.5 font-map text-[18px] text-sepia">
                      {group.publicId}
                    </span>
                  </div>

                  <p className={`${band(1)} font-map text-[20px] text-sepia`}>
                    Tutor <span className="text-jungle-dark">{group.teacherName}</span>
                  </p>

                  <div className={band(2)}>
                    <div className="flex items-center justify-between font-map text-[17px] text-sepia-soft">
                      <span>
                        {group.memberCount} de {group.capacity} cupos
                      </span>
                      <span>{freeSeats} libres</span>
                    </div>

                    {/* Los cupos como una ruta: lo recorrido a tinta, lo que falta apenas marcado. */}
                    <div aria-hidden className="relative mt-1 h-[14px]">
                      <span className="map-route-dashes absolute inset-0 opacity-25" />
                      <span
                        className="absolute inset-y-0 left-0 flex items-center"
                        style={{ width: `${filled}%` }}
                      >
                        <span className="map-route-dashes h-full flex-1" />
                        <img src={routeX} alt="" className="h-[14px] w-auto shrink-0" />
                      </span>
                    </div>
                  </div>

                  {/* Una notita clavada en la esquina del pergamino, no una barra que lo cruce entero. */}
                  <div className={`${band(3)} flex justify-end`}>
                    <button
                      type="button"
                      onClick={() => onRequestJoin(group.id)}
                      disabled={isFull}
                      className={`flex -rotate-[2deg] items-center gap-2 font-map text-[22px] ${
                        isFull
                          ? 'cursor-not-allowed rounded-md border-2 border-dashed border-sepia-soft px-4 py-1 text-sepia-soft'
                          : 'note-paper px-4 text-sepia transition-transform duration-150 hover:rotate-0 hover:scale-105 motion-reduce:transition-none'
                      }`}
                    >
                      {isFull ? 'Salón lleno' : 'Solicitar ingreso'}
                      {isFull ? null : <ArrowIcon />}
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
