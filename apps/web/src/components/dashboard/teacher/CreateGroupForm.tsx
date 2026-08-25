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

export const CreateGroupForm = ({
  defaultTeacherName,
  onCreate,
  onCancel,
}: CreateGroupFormProps) => {
  const [name, setName] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [teacherName, setTeacherName] = useState(defaultTeacherName);
  const [capacity, setCapacity] = useState('30');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length < 3) {
      setError('El nombre del salón necesita al menos 3 caracteres.');
      return;
    }

    if (gradeLabel.trim().length === 0) {
      setError('Indica a qué grado o curso pertenece el salón.');
      return;
    }

    const parsedCapacity = Number.parseInt(capacity, 10);

    if (
      Number.isNaN(parsedCapacity) ||
      parsedCapacity < MIN_CAPACITY ||
      parsedCapacity > MAX_CAPACITY
    ) {
      setError(`Los cupos deben estar entre ${MIN_CAPACITY} y ${MAX_CAPACITY}.`);
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
    <section className="card px-6 py-6">
      <h2 className="font-display text-[24px] text-grape-dark">Crear un salón nuevo</h2>
      <p className="subtitle mt-1">
        Al crearlo recibirá un ID único y su propia insignia, para que los exploradores lo
        reconozcan al buscarlo.
      </p>

      <form onSubmit={handleSubmit} className="mt-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="group-name" className="field-label">
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
              className="field mt-2"
            />
          </div>

          <div>
            <label htmlFor="group-grade" className="field-label">
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
              className="field mt-2"
            />
          </div>

          <div>
            <label htmlFor="group-teacher" className="field-label">
              Profesor a cargo
            </label>
            <input
              id="group-teacher"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="field mt-2"
            />
          </div>

          <div>
            <label htmlFor="group-capacity" className="field-label">
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
              className="field mt-2"
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-[15px] font-bold text-coral-dark">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-grape">
            Crear salón
          </button>

          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
};
