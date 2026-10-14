import type { ReactNode } from 'react';
import { hasFilters, type ActivityFilter, type RosterFilters } from './rosterFilters';

const ALL = '__todos__';

const ACTIVITY_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'online', label: 'Conectado' },
  { value: 'offline', label: 'Inactivo' },
];

const ChevronIcon = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-soft"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

/** Un selector con la misma pinta que los filtros de la lista de mundos. */
export const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) => (
  <label className="block min-w-[160px]">
    <span className="field-label mb-2 block">{label}</span>
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field appearance-none pr-10 font-display"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </span>
  </label>
);

/*
 * Los filtros de las tablas del tutor: nombre, mundo y actividad. Los eligió el
 * usuario y no hay más; la tabla de misiones mete su selector de estado como
 * hijo. Quien la usa guarda los filtros, porque es quien decide cuándo se
 * vacían.
 */
export const RosterFilterBar = ({
  filters,
  onChange,
  worlds,
  extraActive = false,
  onClear,
  children,
}: {
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
  worlds: { value: string; label: string }[];
  /** Hay puesto algún filtro de los que llegan como hijos. */
  extraActive?: boolean;
  onClear: () => void;
  children?: ReactNode;
}) => (
  <div className="mb-3 flex flex-wrap items-end gap-3">
    <label className="block min-w-[200px] flex-1">
      <span className="field-label mb-2 block">Buscar por nombre</span>
      <input
        type="search"
        value={filters.name}
        onChange={(event) => onChange({ ...filters, name: event.target.value })}
        placeholder="Escribe un nombre"
        className="field"
      />
    </label>

    <FilterSelect
      label="Mundo"
      value={filters.world ?? ALL}
      onChange={(value) => onChange({ ...filters, world: value === ALL ? null : value })}
      options={[{ value: ALL, label: 'Todos' }, ...worlds]}
    />

    <FilterSelect
      label="Actividad"
      value={filters.activity}
      onChange={(value) => onChange({ ...filters, activity: value as ActivityFilter })}
      options={ACTIVITY_OPTIONS}
    />

    {children}

    {hasFilters(filters) || extraActive ? (
      <button type="button" onClick={onClear} className="btn btn-sm btn-ghost">
        Quitar filtros
      </button>
    ) : null}
  </div>
);
