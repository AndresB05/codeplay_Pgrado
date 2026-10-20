import { useState } from 'react';
import type { ClassroomStudent, Mission } from '../../../types/classroom.types';
import { FilterSelect, RosterFilterBar } from '../shared/RosterFilterBar';
import { filterRoster, NO_FILTERS, worldOptions, type RosterFilters } from '../shared/rosterFilters';

type StatusFilter = 'all' | 'done' | 'pending';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'done', label: 'Cumplida' },
  { value: 'pending', label: 'Pendiente' },
];

/*
 * Quién ha cumplido qué, con los filtros del tutor. EL ESTADO VA POR FILA: una
 * fila es un explorador con una columna por misión, así que «cumplida» es que
 * las tiene todas y «pendiente» que le falta alguna. Filtrar por una misión
 * concreta pediría elegirla, y ése sería un filtro más de los que eligió el
 * usuario.
 *
 * Quien la monta le pone el salón como `key`: cambiar de salón vacía los
 * filtros, porque el mundo elegido puede no existir en el otro.
 */
export const MissionCompletionTable = ({
  students,
  missions,
  completedPairs,
  onlineIds,
}: {
  students: ClassroomStudent[];
  missions: Mission[];
  /** Claves «alumno:misión» de lo cumplido. */
  completedPairs: ReadonlySet<string>;
  onlineIds: ReadonlySet<string>;
}) => {
  const [filters, setFilters] = useState<RosterFilters>(NO_FILTERS);
  const [status, setStatus] = useState<StatusFilter>('all');

  const isDone = (student: ClassroomStudent) =>
    missions.every((mission) => completedPairs.has(`${student.id}:${mission.key}`));

  const rows = filterRoster(students, filters, onlineIds).filter(
    (student) => status === 'all' || isDone(student) === (status === 'done')
  );

  const clear = () => {
    setFilters(NO_FILTERS);
    setStatus('all');
  };

  return (
    <div className="tutor-card mt-4 overflow-hidden">
      {/* Los filtros dentro de la tarjeta: los campos van sobre blanco. */}
      <div className="border-b border-tutor-rule px-4 py-3">
        <RosterFilterBar
          filters={filters}
          onChange={setFilters}
          worlds={worldOptions(students)}
          extraActive={status !== 'all'}
          onClear={clear}
          variant="tutor"
        >
          <FilterSelect
            label="Estado"
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            options={STATUS_OPTIONS}
            variant="tutor"
          />
        </RosterFilterBar>
      </div>

      <div className="overflow-x-auto">
        <table className="tutor-table min-w-[560px]">
          <thead>
            <tr>
              <th scope="col">Explorador</th>
              {missions.map((mission) => (
                <th key={mission.key} scope="col">
                  {mission.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => (
              <tr key={student.id}>
                <td className="font-semibold text-tutor-ink">{student.name}</td>
                {missions.map((mission) => {
                  const isCompleted = completedPairs.has(`${student.id}:${mission.key}`);

                  return (
                    <td key={mission.key}>
                      <span
                        className={`tutor-badge ${isCompleted ? 'tutor-badge-ok' : 'tutor-badge-warn'}`}
                      >
                        {isCompleted ? 'Cumplida' : 'Pendiente'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-tutor-ink-soft">Ningún explorador coincide con los filtros.</p>
            <button
              type="button"
              onClick={clear}
              className="tutor-btn tutor-btn-secondary tutor-btn-sm mt-3"
            >
              Quitar filtros
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
