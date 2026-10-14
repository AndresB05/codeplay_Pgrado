import { useState } from 'react';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { FilterSelect } from '../shared/RosterFilterBar';
import { matchesName, sortByName, type NameOrder } from '../shared/rosterFilters';
import { chipClass } from './chipClass';

/*
 * A QUIÉN SE MIRA EN EL SEGUIMIENTO. En un salón real son veintiséis nombres
 * largos, y como botones sueltos ocupaban seis filas: ahora se busca escribiendo
 * y la lista se queda en una caja de unas tres filas que se desplaza por dentro.
 *
 * No es un combobox a propósito: esconder la lista deja al tutor que no recuerda
 * el nombre exacto sin ver a quién puede elegir, y su patrón accesible —listbox,
 * flechas, foco— no existe en el repo. Los chips de siempre se recorren con Tab.
 *
 * El elegido va fijo encima y no depende de la búsqueda. Quien lo monta le pone
 * el alcance como `key`: cambiar de salón vacía lo escrito.
 */
export const StudentPicker = ({
  students,
  selectedId,
  onSelect,
}: {
  students: ClassroomStudent[];
  selectedId: string | null;
  /** `undefined` quita la elección. */
  onSelect: (studentId: string | undefined) => void;
}) => {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<NameOrder>('asc');
  const selected = students.find((student) => student.id === selectedId) ?? null;
  const matches = sortByName(
    students.filter((student) => matchesName(student.name, query)),
    order
  );

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[220px] flex-1">
          <span className="field-label mb-2 block">Buscar explorador</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Escribe un nombre"
            className="field"
          />
        </label>

        <FilterSelect
          label="Ordenar"
          value={order}
          onChange={(value) => setOrder(value as NameOrder)}
          options={[
            { value: 'asc', label: 'A-Z' },
            { value: 'desc', label: 'Z-A' },
          ]}
        />

        {selected !== null ? (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            aria-label={`Dejar de ver a ${selected.name}`}
            className={chipClass(true)}
          >
            {selected.name} ✕
          </button>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <p className="mt-3 text-[15px] font-bold text-ink-faint">Ningún explorador se llama así.</p>
      ) : (
        <div className="mt-3 flex max-h-[156px] flex-wrap items-center gap-2 overflow-y-auto pr-1">
          {matches.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelect(student.id === selectedId ? undefined : student.id)}
              aria-pressed={student.id === selectedId}
              className={chipClass(student.id === selectedId)}
            >
              {student.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
