import { useState, type ReactNode } from 'react';
import inkBlot from '../../../assets/brand/roster-ink-blot.webp';
import coffeeRing from '../../../assets/brand/roster-coffee-ring.webp';
import pawPrint from '../../../assets/brand/roster-paw.webp';
import sealBronze from '../../../assets/brand/podium-seal-bronze.webp';
import sealGold from '../../../assets/brand/podium-seal-gold.webp';
import sealSilver from '../../../assets/brand/podium-seal-silver.webp';
import streakNote from '../../../assets/brand/streak-note.webp';
import { explorerLevel } from '../../../constants/progress';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { XPBar } from '../../ui/XPBar';
import { formatLastActivity } from '../teacher/classroomsData';
import { pickTilt, TILT_ON_HOVER } from './pickTilt';
import { sortRoster, type RosterSortKey } from './podiumRanking';
import { RosterFilterBar } from './RosterFilterBar';
import { filterRoster, NO_FILTERS, worldOptions, type RosterFilters } from './rosterFilters';

const NOBODY_ONLINE: ReadonlySet<string> = new Set();

const RANK_SEALS = [sealGold, sealSilver, sealBronze];

/*
 * Manchas del pergamino de la tabla, repartidas como caídas al azar. Las
 * posiciones van en porcentaje para que se repartan igual con pocos o con
 * muchos exploradores; son tenues porque algunas pasan por debajo del texto.
 */
const STAINS = [
  { src: inkBlot, place: 'right-[30px] top-[14px] w-[130px] rotate-[14deg] opacity-60' },
  { src: coffeeRing, place: 'left-[37%] top-[18%] w-[150px] rotate-[25deg] opacity-30' },
  { src: pawPrint, place: 'bottom-[7%] left-[2%] w-[90px] -rotate-[18deg] opacity-25' },
  { src: inkBlot, place: 'bottom-[18px] left-[56%] w-[100px] -rotate-[40deg] opacity-50' },
  { src: coffeeRing, place: 'bottom-[22%] right-[1%] w-[130px] -rotate-[10deg] opacity-35' },
  { src: pawPrint, place: 'left-[24%] top-[40%] w-[70px] rotate-[22deg] opacity-20' },
];

const SORT_OPTIONS: { key: RosterSortKey; label: string }[] = [
  { key: 'xp', label: 'Más XP' },
  { key: 'streak', label: 'Mayor racha' },
  { key: 'name', label: 'A-Z' },
];

const WorldBadgeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2.2" />
    <path d="M9.5 14L11.2 10.8L14.5 9.2L12.8 12.4L9.5 14Z" fill="white" />
  </svg>
);

const FireIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SleepIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 14.5A8 8 0 019.5 4 8.5 8.5 0 1020 14.5Z"
      fill="#E3D9F7"
      stroke="#8B82A6"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

interface StudentRosterTableProps {
  students: ClassroomStudent[];
  /** Se muestra cuando el salón todavía no tiene niños inscritos. */
  emptyLabel?: string;
  /**
   * Si se pasa, aparece la columna de acciones con la opción de sacar al niño
   * del salón. Solo el tutor la recibe.
   */
  onRemoveStudent?: (studentId: string) => void;
  /** Quién tiene CodePlay abierto ahora: lleva el punto verde y «En línea». */
  onlineIds?: ReadonlySet<string>;
  /**
   * `map`: sobre el pergamino del podio y escrita a mano, como el resto del salón del niño.
   * `tutor`: tabla densa, con los filtros y el orden dentro de la misma superficie blanca.
   */
  variant?: 'card' | 'map' | 'tutor';
}

const streakLabel = (days: number): string => (days === 1 ? '1 día' : `${days} días`);

/**
 * Tabla de seguimiento de los niños de un salón. La usan tanto el panel del
 * tutor como la vista de "Salón de clases" del niño.
 */
export const StudentRosterTable = ({
  students,
  emptyLabel = 'Todavía no hay exploradores en este salón.',
  onRemoveStudent,
  onlineIds,
  variant = 'card',
}: StudentRosterTableProps) => {
  const onMap = variant === 'map';
  /*
   * El puesto es siempre el de XP, como en el podio, aunque la tabla se ordene
   * por racha o por nombre: es el que el niño reconoce de encima.
   */
  const xpRank = new Map(
    sortRoster(students, 'xp').map((student, index) => [student.id, index + 1])
  );
  /* Cada pieza tiene dos trajes: el de la tarjeta blanca y el del pergamino. */
  const look = (map: string, card: string) => (onMap ? map : card);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<RosterSortKey>('xp');
  const [filters, setFilters] = useState<RosterFilters>(NO_FILTERS);

  /*
   * LOS FILTROS SON DEL TUTOR, y la marca que separa su vista de la del niño es
   * la que ya existía: sólo él puede sacar a alguien del salón. Se filtra antes
   * de ordenar, para que el orden elegido se mantenga.
   */
  const filterable = onRemoveStudent !== undefined;
  const visibleStudents = filterable
    ? filterRoster(students, filters, onlineIds ?? NOBODY_ONLINE)
    : students;
  const sortedStudents = sortRoster(visibleStudents, sortKey);

  /*
   * La columna de XP cambia de sitio según quién mira: el niño la ve junto a la
   * última actividad y el tutor junto a las acciones. Es lo pedido, no un
   * descuido de la reutilización, así que las dos ramas se amplían por separado.
   */
  const gridColumns = onRemoveStudent
    ? 'grid-cols-[1.35fr_1fr_1fr_0.7fr_0.8fr_1.2fr]'
    : 'grid-cols-[1.35fr_1fr_1fr_0.8fr_0.7fr]';

  /*
   * LA CELDA DICE TRES COSAS, decidido por el usuario: la barra, el XP
   * acumulado y el Nivel Explorador. La barra sola ORDENA MAL —se vacía al subir
   * de tramo, así que un alumno recién ascendido se ve por detrás de otro que
   * va peor y está a punto de subir—, y quien mira esta tabla es justo quien
   * tiene que comparar. El número ordena; el nivel explica la barra.
   */
  /*
   * Centra la notita en el título de su columna, que no se mueve. Una copia
   * invisible del título da el ancho de referencia; los márgenes negativos dejan
   * que la notita, más ancha, sobresalga por igual a los dos lados sin empujarlo.
   */
  const underTitle = (title: string, content: ReactNode) => (
    <div className="flex w-fit flex-col items-center">
      <span aria-hidden className="invisible h-0 overflow-hidden font-map text-[20px]">
        {title}
      </span>
      <div className="-mx-[200px] flex justify-center">{content}</div>
    </div>
  );

  const xpCell = (xp: number) => (
    /* En el pergamino, el XP va en una notita de papel pegada encima de la fila. */
    <div
      onMouseEnter={onMap ? pickTilt : undefined}
      className={look(`relative isolate w-[220px] -rotate-[1.5deg] px-5 py-4 ${TILT_ON_HOVER}`, '')}
    >
      {onMap ? (
        <div aria-hidden className="note-paper pointer-events-none absolute inset-0 -z-10" />
      ) : null}
      <div className="flex flex-col gap-1">
        <span
          className={look(
            'font-map text-[18px] leading-none text-sepia',
            'font-display text-[15px] text-ink'
          )}
        >
          {xp} XP
        </span>
        <XPBar xp={xp} showLabel={false} />
        <span
          className={look(
            'font-map text-[15px] leading-none text-sepia-soft',
            'text-[12px] font-semibold text-ink-soft'
          )}
        >
          Nivel Explorador {explorerLevel(xp)}
        </span>
      </div>
    </div>
  );

  const handleRemove = (studentId: string) => {
    onRemoveStudent?.(studentId);
    setConfirmingId(null);
  };

  if (variant === 'tutor') {
    return (
      <div className="tutor-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-tutor-rule px-4 py-3">
          {filterable && students.length > 0 ? (
            <div className="min-w-0 flex-1">
              <RosterFilterBar
                filters={filters}
                onChange={setFilters}
                worlds={worldOptions(students)}
                onClear={() => setFilters(NO_FILTERS)}
                variant="tutor"
              />
            </div>
          ) : null}

          <div role="group" aria-label="Ordenar exploradores" className="flex items-center gap-2">
            <span className="text-[13.5px] font-medium text-tutor-ink-soft">Ordenar</span>
            <div className="tutor-seg">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSortKey(option.key)}
                  aria-pressed={sortKey === option.key}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-tutor-ink-soft">{emptyLabel}</p>
        ) : sortedStudents.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] text-tutor-ink-soft">
              Ningún explorador coincide con los filtros.
            </p>
            <button
              type="button"
              onClick={() => setFilters(NO_FILTERS)}
              className="tutor-btn tutor-btn-secondary tutor-btn-sm mt-3"
            >
              Quitar filtros
            </button>
          </div>
        ) : (
          /*
           * Con un salón de treinta, la tabla empujaba todo lo demás fuera de la
           * pantalla: se desplaza por dentro y la cabecera se queda. El borde de la
           * cabecera va como sombra porque, con `border-collapse`, el borde no
           * acompaña a la celda fija.
           */
          <div className="max-h-[560px] overflow-auto overscroll-contain">
            <table className="tutor-table min-w-[720px]">
              <thead className="sticky top-0 z-[1] [&_th]:shadow-[inset_0_-1px_0_var(--tutor-rule)]">
                <tr>
                  <th scope="col">Explorador</th>
                  <th scope="col">Mundo actual</th>
                  <th scope="col">Última actividad</th>
                  <th scope="col" className="tutor-num">
                    Racha
                  </th>
                  <th scope="col">XP</th>
                  {onRemoveStudent ? (
                    <th scope="col" className="tutor-num">
                      Acciones
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student) => {
                  const online = onlineIds?.has(student.id) ?? false;

                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="flex items-center gap-2.5 font-semibold">
                          <span className="relative h-[30px] w-[30px] shrink-0">
                            <img
                              src={pickMascotAvatar(student.id, student.name)}
                              alt=""
                              className="h-full w-full rounded-full border border-tutor-rule object-cover"
                            />
                            {online ? (
                              <span
                                aria-hidden="true"
                                className="absolute -bottom-0.5 -right-0.5 h-[10px] w-[10px] rounded-full border-2 border-tutor-surface bg-tutor-ok"
                              />
                            ) : null}
                          </span>
                          {student.name}
                        </div>
                      </td>

                      <td>
                        {student.currentWorld ?? <span className="text-tutor-ink-faint">—</span>}
                      </td>

                      <td>
                        {online ? (
                          <span className="tutor-badge tutor-badge-ok">En línea</span>
                        ) : (
                          <span
                            className={
                              student.hoursSinceLastActivity === null
                                ? 'text-tutor-ink-faint'
                                : 'text-tutor-ink-soft'
                            }
                          >
                            {formatLastActivity(student.hoursSinceLastActivity)}
                          </span>
                        )}
                      </td>

                      <td className="tutor-num whitespace-nowrap">
                        {student.streakDays === null ? (
                          <span className="text-tutor-ink-faint">—</span>
                        ) : (
                          streakLabel(student.streakDays)
                        )}
                      </td>

                      {/*
                       * SIN BARRA, a diferencia del niño: la barra mide el tramo del
                       * nivel, y en una columna se lee como comparación entre
                       * alumnos —quien acaba de subir sale casi vacío—. Al profesor
                       * le basta el número, que es lo que ordena.
                       */}
                      <td className="py-1.5">
                        <span className="block whitespace-nowrap">{student.xp} XP</span>
                        <span className="block whitespace-nowrap text-[12.5px] text-tutor-ink-faint">
                          Nivel Explorador {explorerLevel(student.xp)}
                        </span>
                      </td>

                      {onRemoveStudent ? (
                        <td className="tutor-num">
                          {confirmingId === student.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRemove(student.id)}
                                className="tutor-btn tutor-btn-danger-solid tutor-btn-sm"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                className="tutor-btn tutor-btn-secondary tutor-btn-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmingId(student.id)}
                              className="tutor-btn tutor-btn-danger tutor-btn-sm"
                            >
                              Quitar
                            </button>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {filterable && students.length > 0 ? (
        <RosterFilterBar
          filters={filters}
          onChange={setFilters}
          worlds={worldOptions(students)}
          onClear={() => setFilters(NO_FILTERS)}
        />
      ) : null}

      <div
        role="group"
        aria-label="Ordenar exploradores"
        className="mb-3 flex flex-wrap items-center justify-end gap-2"
      >
        <span
          className={look(
            'font-map text-[18px] font-normal text-sepia',
            'text-[14px] font-bold text-ink-faint'
          )}
        >
          Ordenar por
        </span>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSortKey(option.key)}
            aria-pressed={sortKey === option.key}
            className={
              onMap
                ? `rounded-md border-2 px-3 py-0.5 font-map text-[18px] font-normal transition-colors ${
                    sortKey === option.key
                      ? 'border-wood-ink bg-wood-bark text-cream'
                      : 'border-dashed border-sepia bg-wood-bare/70 text-sepia hover:bg-wood-bare'
                  }`
                : `rounded-full border-2 px-3 py-1 font-display text-[14px] transition-colors ${
                    sortKey === option.key
                      ? 'border-ink bg-grape text-white'
                      : 'border-line bg-white text-ink hover:bg-cream'
                  }`
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <section
        className={look('relative isolate px-6 pb-8 pt-7 font-normal', 'card overflow-hidden')}
      >
        {onMap ? (
          <>
            <div aria-hidden className="podium-scroll pointer-events-none absolute inset-0 -z-10" />
            {STAINS.map(({ src, place }) => (
              <img
                key={place}
                src={src}
                alt=""
                aria-hidden
                className={`pointer-events-none absolute -z-[5] ${place}`}
              />
            ))}
          </>
        ) : null}
        <div
          className={`grid ${gridColumns} ${look(
            'rounded-lg border-b-2 border-dashed border-sepia-soft bg-sepia-soft/30 px-5 py-3 font-map text-[20px] text-sepia',
            'border-b-[3px] border-ink bg-grape-soft px-5 py-4 font-display text-[15px] text-grape-dark'
          )}`}
        >
          <div>Explorador</div>
          {/* En el pergamino, cada notita arranca donde arranca su título. */}
          <div>Mundo actual</div>
          <div>Última actividad</div>
          {onRemoveStudent ? null : <div>XP</div>}
          <div>Racha</div>
          {onRemoveStudent ? <div>XP</div> : null}
          {onRemoveStudent ? <div className="text-right">Acciones</div> : null}
        </div>

        {students.length === 0 ? (
          <p
            className={`px-5 py-10 text-center ${look('font-map text-[19px] text-sepia-soft', 'text-[16px] font-semibold text-ink-faint')}`}
          >
            {emptyLabel}
          </p>
        ) : sortedStudents.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[16px] font-semibold text-ink-faint">
              Ningún explorador coincide con los filtros.
            </p>
            <button
              type="button"
              onClick={() => setFilters(NO_FILTERS)}
              className="btn btn-sm btn-ghost mt-3"
            >
              Quitar filtros
            </button>
          </div>
        ) : (
          <div>
            {sortedStudents.map((student, index) => (
              <div
                key={student.id}
                className={`grid ${gridColumns} items-center px-5 py-4 last:border-b-0 ${look(
                  `border-b-2 border-dashed border-sepia-soft/50 text-sepia ${index % 2 === 1 ? 'bg-sepia-soft/15' : ''}`,
                  `border-b-2 border-line text-[16px] text-ink ${index % 2 === 1 ? 'bg-cream' : 'bg-white'}`
                )}`}
              >
                {/* La notita del mundo sobresale de su columna: el nombre se queda antes y baja a dos líneas. */}
                <div className={`flex items-center gap-3 ${look('min-w-0 pr-14', '')}`}>
                  {onMap ? (
                    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center">
                      {(xpRank.get(student.id) ?? 0) <= 3 && student.xp > 0 ? (
                        <img
                          src={RANK_SEALS[(xpRank.get(student.id) ?? 1) - 1]}
                          alt={`Puesto ${xpRank.get(student.id)}`}
                          className="h-[34px] w-[34px]"
                        />
                      ) : (
                        <span className="font-map text-[22px] text-sepia-soft">
                          <span className="sr-only">Puesto </span>
                          {xpRank.get(student.id)}.º
                        </span>
                      )}
                    </span>
                  ) : null}
                  <div className="relative h-[44px] w-[44px] shrink-0">
                    <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-ink">
                      <img
                        src={pickMascotAvatar(student.id, student.name)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {onlineIds?.has(student.id) ? (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 -right-1 h-[16px] w-[16px] rounded-full border-[3px] border-white bg-jungle-light"
                      />
                    ) : null}
                  </div>
                  <span
                    className={look(
                      'min-w-0 break-words font-map text-[21px] leading-tight',
                      'font-bold'
                    )}
                  >
                    {student.name}
                  </span>
                </div>

                <div>
                  {student.currentWorld ? (
                    onMap ? (
                      underTitle(
                        'Mundo actual',
                        <span
                          onMouseEnter={pickTilt}
                          className={`relative isolate inline-block whitespace-nowrap rotate-[1.5deg] px-4 py-5 ${TILT_ON_HOVER}`}
                        >
                          <span
                            aria-hidden
                            className="note-paper pointer-events-none absolute inset-0 -z-10"
                          />
                          <span className="inline-block -rotate-[2deg] rounded-md border-2 border-dashed border-jungle-dark px-2 font-map text-[17px] text-jungle-dark">
                            {student.currentWorld}
                          </span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mint px-3 py-1 font-display text-[13px] text-white">
                        <WorldBadgeIcon />
                        {student.currentWorld}
                      </span>
                    )
                  ) : (
                    <span className={look('text-sepia-soft', 'text-ink-faint')}>—</span>
                  )}
                </div>

                {onlineIds?.has(student.id) ? (
                  <div>
                    <span
                      className={look(
                        'inline-block -rotate-[3deg] rounded-md border-[3px] border-double border-jungle-dark px-2 font-map text-[19px] text-jungle-dark',
                        'font-display text-[15px] text-jungle-dark'
                      )}
                    >
                      En línea
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-2 ${look('font-map text-[19px] text-sepia-soft', 'font-semibold text-ink-soft')}`}
                  >
                    {student.hoursSinceLastActivity === null ? <SleepIcon /> : null}
                    {formatLastActivity(student.hoursSinceLastActivity)}
                  </div>
                )}

                {onRemoveStudent ? null : (
                  <div>{onMap ? underTitle('XP', xpCell(student.xp)) : xpCell(student.xp)}</div>
                )}

                <div>
                  {student.streakDays !== null && onMap ? (
                    /* La notita de la racha, apagada en gris si la racha está en cero. */
                    <span
                      onMouseEnter={pickTilt}
                      className={`relative inline-block h-[84px] w-[84px] ${TILT_ON_HOVER} ${
                        student.streakDays === 0 ? 'grayscale' : ''
                      }`}
                    >
                      <img src={streakNote} alt="" className="h-full w-full" />
                      <span className="absolute right-[12px] top-1/2 flex w-[30px] -translate-y-1/2 justify-center font-map text-[26px] leading-none text-sepia">
                        <span className="sr-only">Racha de </span>
                        {student.streakDays}
                      </span>
                    </span>
                  ) : student.streakDays !== null ? (
                    <span
                      className={`inline-flex items-center gap-1.5 ${look('font-map text-[21px] text-sepia', 'font-display text-[18px] text-sun-dark')}`}
                    >
                      <FireIcon />
                      {student.streakDays}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </div>

                {onRemoveStudent ? <div>{xpCell(student.xp)}</div> : null}

                {onRemoveStudent ? (
                  <div className="flex justify-end">
                    {confirmingId === student.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemove(student.id)}
                          className="btn btn-sm btn-coral"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="btn btn-sm btn-ghost"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(student.id)}
                        className="rounded-full border-2 border-coral-dark bg-coral-soft px-4 py-1.5 font-display text-[14px] text-coral-dark transition-colors hover:bg-coral hover:text-white"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
