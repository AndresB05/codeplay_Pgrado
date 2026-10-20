import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateGroupInput } from '../../../types/classroom.types';

interface CreateGroupFormProps {
  defaultTeacherName: string;
  onCreate: (input: CreateGroupInput) => void;
  onCancel: () => void;
}

const MIN_CAPACITY = 1;
const MAX_CAPACITY = 60;

const ERROR_ID = 'create-group-error';

type FieldKey = 'name' | 'grade' | 'capacity';

export const CreateGroupForm = ({
  defaultTeacherName,
  onCreate,
  onCancel,
}: CreateGroupFormProps) => {
  const [name, setName] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [teacherName, setTeacherName] = useState(defaultTeacherName);
  const [capacity, setCapacity] = useState('30');
  /* Qué campo falla, además del mensaje: el lector de pantalla lo anuncia en ese campo. */
  const [error, setError] = useState<{ field: FieldKey; message: string } | null>(null);

  const invalidProps = (field: FieldKey) =>
    error?.field === field ? { 'aria-invalid': true, 'aria-describedby': ERROR_ID } : {};

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length < 3) {
      setError({ field: 'name', message: 'El nombre del salón necesita al menos 3 caracteres.' });
      return;
    }

    if (gradeLabel.trim().length === 0) {
      setError({ field: 'grade', message: 'Indica a qué grado o curso pertenece el salón.' });
      return;
    }

    const parsedCapacity = Number.parseInt(capacity, 10);

    if (
      Number.isNaN(parsedCapacity) ||
      parsedCapacity < MIN_CAPACITY ||
      parsedCapacity > MAX_CAPACITY
    ) {
      setError({
        field: 'capacity',
        message: `Los cupos deben estar entre ${MIN_CAPACITY} y ${MAX_CAPACITY}.`,
      });
      return;
    }

    onCreate({
      name,
      gradeLabel,
      teacherName: teacherName.trim() || defaultTeacherName,
      capacity: parsedCapacity,
    });
  };

  return (
    <section className="tutor-card px-5 py-5">
      <h2 className="text-[19px] leading-tight text-tutor-ink">Crear un salón nuevo</h2>
      <p className="mt-1 max-w-[72ch] text-tutor-ink-soft">
        Al crearlo recibirá un ID único y su propia insignia, para que los exploradores lo
        reconozcan al buscarlo.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="group-name" className="text-[13.5px] font-medium text-tutor-ink-soft">
              Nombre del salón
            </label>
            <input
              id="group-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Salón 3C"
              {...invalidProps('name')}
              className="tutor-field mt-1.5"
            />
          </div>

          <div>
            <label htmlFor="group-grade" className="text-[13.5px] font-medium text-tutor-ink-soft">
              Grado o curso
            </label>
            <input
              id="group-grade"
              value={gradeLabel}
              onChange={(event) => {
                setGradeLabel(event.target.value);
                setError(null);
              }}
              placeholder="Tercero de primaria"
              {...invalidProps('grade')}
              className="tutor-field mt-1.5"
            />
          </div>

          <div>
            <label
              htmlFor="group-teacher"
              className="text-[13.5px] font-medium text-tutor-ink-soft"
            >
              Tutor a cargo
            </label>
            <input
              id="group-teacher"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="tutor-field mt-1.5"
            />
          </div>

          <div>
            <label
              htmlFor="group-capacity"
              className="text-[13.5px] font-medium text-tutor-ink-soft"
            >
              Cupos
            </label>
            <input
              id="group-capacity"
              type="number"
              min={MIN_CAPACITY}
              max={MAX_CAPACITY}
              value={capacity}
              onChange={(event) => {
                setCapacity(event.target.value);
                setError(null);
              }}
              {...invalidProps('capacity')}
              className="tutor-field mt-1.5"
            />
          </div>
        </div>

        {error ? (
          <p
            id={ERROR_ID}
            role="alert"
            className="mt-4 text-[14.5px] font-semibold text-tutor-danger"
          >
            {error.message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="submit" className="tutor-btn tutor-btn-primary">
            Crear salón
          </button>

          <button type="button" onClick={onCancel} className="tutor-btn tutor-btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
};
