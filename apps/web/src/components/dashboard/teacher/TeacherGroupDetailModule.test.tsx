import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassroomsContext } from '../../../context/ClassroomsContext';
import { buildClassroomsValue } from '../../../test/buildClassroomsValue';
import type { ClassGroup, ClassroomStudent } from '../../../types/classroom.types';
import { TeacherGroupDetailModule } from './TeacherGroupDetailModule';

/*
 * Fuera los servicios que el detalle arrastra al importarse (exportar e
 * invitar): validan las variables de entorno de Supabase al cargar.
 */
vi.mock('../../../services/studentProgress.service', () => ({ studentProgressService: {} }));
vi.mock('../../../hooks/useInvitations', () => ({ useInvitations: () => ({}) }));

const student = (id: string, name: string): ClassroomStudent => ({
  id,
  name,
  initials: 'AL',
  avatarTone: 'bg-grape',
  currentWorld: null,
  hoursSinceLastActivity: null,
  streakDays: null,
  xp: 0,
  attemptedLevels: 0,
  completedLevels: 0,
  completedWorlds: 0,
  totalAttempts: 0,
  averageBestScore: null,
});

const buildGroup = (id: string, name: string, students: ClassroomStudent[]): ClassGroup => ({
  id,
  publicId: `CP-${id.toUpperCase()}`,
  name,
  gradeLabel: 'Cuarto',
  teacherName: 'Prueba',
  capacity: 20,
  memberCount: students.length,
  students,
  pendingRequests: [],
});

const MUSICA = buildGroup('g1', 'Música', [student('s1', 'Ana'), student('s2', 'Bruno')]);
const ARTE = buildGroup('g2', 'Arte', [student('s3', 'Carla')]);

/* Como el panel: el `groupId` sale de la ruta, así que navegar cambia de salón. */
const DetailFromRoute = () => <TeacherGroupDetailModule groupId={useParams().groupId} />;
const CurrentPath = () => <p data-testid="ruta">{useLocation().pathname}</p>;

const renderDetail = (groups: ClassGroup[]) =>
  render(
    <MemoryRouter initialEntries={['/teacher/groups/g1']}>
      <ClassroomsContext.Provider value={buildClassroomsValue({ groups })}>
        <Routes>
          <Route path="/teacher/groups/:groupId" element={<DetailFromRoute />} />
        </Routes>
        <CurrentPath />
      </ClassroomsContext.Provider>
    </MemoryRouter>
  );

describe('TeacherGroupDetailModule: ir a otro salón', () => {
  /* jsdom no implementa `scrollTo`; espiarlo además deja comprobar que se llama. */
  const scrollTo = vi.fn();

  beforeEach(() => {
    scrollTo.mockClear();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  });

  it('con un solo salón no hay selector', () => {
    renderDetail([MUSICA]);

    expect(screen.queryByLabelText('Ir a otro salón')).not.toBeInTheDocument();
  });

  it('lista los salones por nombre, con el actual elegido, y navega al elegido', async () => {
    renderDetail([MUSICA, ARTE]);
    const select = screen.getByLabelText('Ir a otro salón');

    expect(select).toHaveValue('g1');
    expect(
      Array.from((select as HTMLSelectElement).options).map((option) => option.textContent)
    ).toEqual(['Arte · 1 alumno', 'Música · 2 alumnos']);

    await userEvent.selectOptions(select, 'g2');

    expect(screen.getByTestId('ruta')).toHaveTextContent('/teacher/groups/g2');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arte');
  });

  it('al cambiar de salón el filtro del roster vuelve a estar vacío', async () => {
    renderDetail([MUSICA, ARTE]);

    await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'zzz');
    expect(screen.getByLabelText('Buscar por nombre')).toHaveValue('zzz');

    await userEvent.selectOptions(screen.getByLabelText('Ir a otro salón'), 'g2');

    expect(screen.getByLabelText('Buscar por nombre')).toHaveValue('');
    expect(screen.getByText('Carla')).toBeInTheDocument();
  });

  it('al cambiar de salón vuelve arriba sin animar', async () => {
    renderDetail([MUSICA, ARTE]);
    scrollTo.mockClear();

    await userEvent.selectOptions(screen.getByLabelText('Ir a otro salón'), 'g2');

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });
});
