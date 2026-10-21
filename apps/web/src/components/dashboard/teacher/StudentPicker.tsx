import { useId, useState } from 'react';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { FilterSelect } from '../shared/RosterFilterBar';
import { matchesName, sortByName, type NameOrder } from '../shared/rosterFilters';

/*
 * A QUIÉN SE MIRA EN EL SEGUIMIENTO. Una lista a la izquierda de la ficha que se
 * desplaza por dentro: con veintiséis nombres largos, el tutor busca escribiendo
 * y la ficha sigue a la vista mientras cambia de explorador.
 *
 * No es un combobox a propósito: esconder la lista deja al tutor que no recuerda
 * el nombre exacto sin ver a quién puede elegir, y su patrón accesible —listbox,
 * flechas, foco— no existe en el repo. Las filas son botones y se recorren con Tab.
 *
 * El elegido se puede soltar aunque la búsqueda lo deje fuera. Quien lo monta le
 * pone el alcance como `key`: cambiar de salón vacía lo escrito.
 */
export const StudentPicker = ({
  students,
  selectedId,
  onSelect,
  groupNameOf,
  totalLevels,
}: {
  students: ClassroomStudent[];
  selectedId: string | null;
  /** `undefined` quita la elección. */
  onSelect: (studentId: string | undefined) => void;
  /** Con «Todos», el salón de cada uno: dos alumnos pueden llamarse igual. */
  groupNameOf?: (studentId: string) => string | undefined;
  /** Niveles del catálogo. `null` mientras no ha llegado: sin denominador no hay barra. */
  totalLevels: number | null;
}) => {
  const idPrefix = useId();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<NameOrder>('asc');
  const selected = students.find((student) => student.id === selectedId) ?? null;
  const matches = sortByName(
    students.filter((student) => matchesName(student.name, query)),
    order
  );

  /*
   * Sin «✕» en el elegido: en la misma pantalla la cruz dice «no llegó a la
   * meta» en la tira de pasos. Quitar la elección se dice con palabras, y el
   * elegido de la lista también la quita si se pulsa otra vez.
   */
  return (
    <div className="tutor-card overflow-hidden">
      <div className="border-b border-tutor-rule p-3">
        <div className="flex items-end gap-2">
          <label className="block min-w-0 flex-1">
            <span className="mb-2 block text-[13.5px] font-medium text-tutor-ink-soft">
              Buscar explorador
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Escribe un nombre"
              className="tutor-field"
            />
          </label>

          <div className="w-[96px] shrink-0 [&>label]:min-w-0">
            <FilterSelect
              label="Ordenar"
              value={order}
              onChange={(value) => setOrder(value as NameOrder)}
              options={[
                { value: 'asc', label: 'A-Z' },
                { value: 'desc', label: 'Z-A' },
              ]}
              variant="tutor"
            />
          </div>
        </div>

        {selected !== null ? (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="tutor-btn tutor-btn-ghost tutor-btn-sm mt-2"
          >
            Dejar de ver a {selected.name}
          </button>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <p className="px-4 py-6 text-center text-tutor-ink-soft">Ningún explorador se llama así.</p>
      ) : (
        <ul className="max-h-[520px] overflow-y-auto overscroll-contain">
          {matches.map((student) => {
            const isSelected = student.id === selectedId;
            const groupName = groupNameOf?.(student.id);
            const metaId = `${idPrefix}-${student.id}`;
            const meta = [
              groupName,
              totalLevels === null ? null : `${student.completedLevels} de ${totalLevels} niveles`,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <li key={student.id} className="border-b border-tutor-rule last:border-b-0">
                {/*
                 * El nombre accesible es el del explorador, como cuando era un
                 * chip; el salón y los niveles van como descripción.
                 */}
                <button
                  type="button"
                  onClick={() => onSelect(isSelected ? undefined : student.id)}
                  aria-pressed={isSelected}
                  aria-label={student.name}
                  aria-describedby={meta ? metaId : undefined}
                  title={isSelected ? 'Pulsa otra vez para cerrar la ficha' : undefined}
                  className={`tutor-focus block w-full px-4 py-2.5 text-left transition-colors ${
                    isSelected ? 'bg-tutor-accent-soft' : 'hover:bg-tutor-sunken'
                  }`}
                >
                  <span
                    className={`block truncate font-semibold ${
                      isSelected ? 'text-tutor-accent' : 'text-tutor-ink'
                    }`}
                  >
                    {student.name}
                  </span>

                  {meta ? (
                    <span id={metaId} className="block text-[13px] text-tutor-ink-soft">
                      {meta}
                    </span>
                  ) : null}

                  {totalLevels ? (
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block h-[4px] overflow-hidden rounded-full bg-tutor-rule"
                    >
                      <span
                        className="block h-full rounded-full bg-tutor-accent"
                        style={{
                          width: `${Math.min(100, (student.completedLevels / totalLevels) * 100)}%`,
                        }}
                      />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
