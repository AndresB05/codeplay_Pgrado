import { render, screen, within } from '@testing-library/react';
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

const renderDetail = (groups: ClassGroup[], onlineStudentIds = new Set<string>()) =>
  render(
    <MemoryRouter initialEntries={['/teacher/groups/g1']}>
      <ClassroomsContext.Provider value={buildClassroomsValue({ groups, onlineStudentIds })}>
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

describe('TeacherGroupDetailModule: requiere tu atención', () => {
  const DAY = 24;
  const away = (id: string, name: string, days: number | null): ClassroomStudent => ({
    ...student(id, name),
    hoursSinceLastActivity: days === null ? null : days * DAY,
  });

  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  it('sólo lista a quien lleva una semana o más sin jugar y no está conectado', () => {
    renderDetail(
      [
        buildGroup('g1', 'Música', [
          away('s1', 'Ana', 11),
          away('s2', 'Bruno', 3),
          away('s3', 'Carla', 8),
          away('s4', 'Dani', null),
          away('s5', 'Eva', 20),
        ]),
      ],
      new Set(['s5'])
    );

    const block = within(
      screen
        .getByRole('heading', { name: 'Requiere tu atención' })
        .closest('section') as HTMLElement
    );

    expect(
      block
        .getAllByRole('button', { name: /^Ver progreso de / })
        .map((b) => b.getAttribute('aria-label'))
    ).toEqual(['Ver progreso de Ana', 'Ver progreso de Carla']);
    expect(block.getByText('Última actividad hace 11 días')).toBeInTheDocument();
  });

  it('sin nadie así, el bloque no sale', () => {
    renderDetail([buildGroup('g1', 'Música', [away('s1', 'Ana', 2)])]);

    expect(screen.queryByRole('heading', { name: 'Requiere tu atención' })).not.toBeInTheDocument();
  });

  it('enseña cuatro y «Ver todos» despliega el resto', async () => {
    renderDetail([
      buildGroup(
        'g1',
        'Música',
        ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Fede'].map((name, index) =>
          away(`s${index}`, name, 30 - index)
        )
      ),
    ]);

    expect(screen.getAllByRole('button', { name: /^Ver progreso de / })).toHaveLength(4);

    const more = screen.getByRole('button', { name: 'Ver todos (6)' });
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(more);

    expect(screen.getAllByRole('button', { name: /^Ver progreso de / })).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Ver menos' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('«Ver progreso» abre su ficha en el panel', async () => {
    renderDetail([buildGroup('g1', 'Música', [away('s1', 'Ana', 9)])]);

    await userEvent.click(screen.getByRole('button', { name: 'Ver progreso de Ana' }));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/teacher/panel/g1/s1');
  });

  it('en la tabla, «Ver ficha» abre la ficha del explorador en el panel', async () => {
    renderDetail([buildGroup('g1', 'Música', [away('s1', 'Ana', 2)])]);

    await userEvent.click(screen.getByRole('button', { name: 'Ver ficha de Ana' }));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/teacher/panel/g1/s1');
  });

  it('la actividad de una semana o más va en ámbar; la reciente, no', () => {
    renderDetail([buildGroup('g1', 'Música', [away('s1', 'Ana', 7), away('s2', 'Bruno', 6)])]);

    const table = within(screen.getByRole('table'));

    expect(table.getByText('Hace 7 días')).toHaveClass('tutor-badge-warn');
    expect(table.getByText('Hace 6 días')).not.toHaveClass('tutor-badge-warn');
  });
});
