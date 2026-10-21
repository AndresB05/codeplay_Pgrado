import type { ReactNode } from 'react';
import { hasFilters, type ActivityFilter, type RosterFilters } from './rosterFilters';

const ALL = '__todos__';

/* La etiqueta de los campos del tutor: minúscula inicial, sin mayúsculas sostenidas. */
const TUTOR_LABEL = 'text-[13.5px] font-medium text-tutor-ink-soft';

const ACTIVITY_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'online', label: 'Conectado' },
  { value: 'offline', label: 'Inactivo' },
];

type Variant = 'default' | 'tutor';

export const ChevronIcon = ({ variant = 'default' }: { variant?: Variant }) => (
  <span
    aria-hidden="true"
    className={`pointer-events-none absolute inset-y-0 flex items-center ${
      variant === 'tutor' ? 'right-3 text-tutor-ink-soft' : 'right-4 text-ink-soft'
    }`}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth={variant === 'tutor' ? 2.2 : 3}
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
  variant = 'default',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  variant?: Variant;
}) => (
  <label className={`block ${variant === 'tutor' ? 'min-w-[140px]' : 'min-w-[160px]'}`}>
    <span className={`mb-2 block ${variant === 'tutor' ? TUTOR_LABEL : 'field-label'}`}>
      {label}
    </span>
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={
          variant === 'tutor'
            ? 'tutor-field appearance-none pr-9'
            : 'field appearance-none pr-10 font-display'
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronIcon variant={variant} />
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
  variant = 'default',
}: {
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
  worlds: { value: string; label: string }[];
  /** Hay puesto algún filtro de los que llegan como hijos. */
  extraActive?: boolean;
  onClear: () => void;
  children?: ReactNode;
  /** `tutor`: los campos van sobre blanco, así que quien la monta la pone dentro de una superficie. */
  variant?: Variant;
}) => {
  const tutor = variant === 'tutor';

  return (
    <div className={`flex flex-wrap items-end ${tutor ? 'gap-2.5' : 'mb-3 gap-3'}`}>
      <label className={`block flex-1 ${tutor ? 'min-w-[180px]' : 'min-w-[200px]'}`}>
        <span className={`mb-2 block ${tutor ? TUTOR_LABEL : 'field-label'}`}>
          Buscar por nombre
        </span>
        <input
          type="search"
          value={filters.name}
          onChange={(event) => onChange({ ...filters, name: event.target.value })}
          placeholder="Escribe un nombre"
          className={tutor ? 'tutor-field' : 'field'}
        />
      </label>

      <FilterSelect
        label="Mundo"
        value={filters.world ?? ALL}
        onChange={(value) => onChange({ ...filters, world: value === ALL ? null : value })}
        options={[{ value: ALL, label: 'Todos' }, ...worlds]}
        variant={variant}
      />

      <FilterSelect
        label="Actividad"
        value={filters.activity}
        onChange={(value) => onChange({ ...filters, activity: value as ActivityFilter })}
        options={ACTIVITY_OPTIONS}
        variant={variant}
      />

      {children}

      {hasFilters(filters) || extraActive ? (
        <button
          type="button"
          onClick={onClear}
          className={tutor ? 'tutor-btn tutor-btn-ghost' : 'btn btn-sm btn-ghost'}
        >
          Quitar filtros
        </button>
      ) : null}
    </div>
  );
};
