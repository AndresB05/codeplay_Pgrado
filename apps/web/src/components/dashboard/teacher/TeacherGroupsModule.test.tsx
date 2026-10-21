import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ClassroomsContext } from '../../../context/ClassroomsContext';
import { buildClassroomsValue } from '../../../test/buildClassroomsValue';
import type { ClassGroup, ClassroomStudent, JoinRequest } from '../../../types/classroom.types';
import { TeacherGroupsModule } from './TeacherGroupsModule';

const VIEW_KEY = 'dashboard:teacherGroupsView';
const SEARCH = 'Buscar salón por nombre, grado o ID';

const student = (id: string): ClassroomStudent => ({
  id,
  name: `Alumno ${id}`,
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

const request = (id: string): JoinRequest => ({
  id,
  studentId: `pide-${id}`,
  studentName: 'Pide',
  initials: 'PI',
  avatarTone: 'bg-grape',
  requestedAtIso: '2026-10-20T10:00:00.000Z',
});

const buildGroup = (id: string, name: string, overrides: Partial<ClassGroup> = {}): ClassGroup => ({
  id,
  publicId: `CP-${id.toUpperCase()}`,
  name,
  gradeLabel: 'Cuarto',
  teacherName: 'Prueba',
  capacity: 20,
  memberCount: 0,
  students: [],
  pendingRequests: [],
  ...overrides,
});

/*
 * Siete salones, uno más que el umbral. Cada criterio de orden da un primero
 * distinto: «Álgebra» por nombre, «Música» por solicitudes, «Dibujo» por
 * ocupación y «Cálculo» por conectados.
 */
const SEVEN: ClassGroup[] = [
  buildGroup('g1', 'Música', { pendingRequests: [request('1'), request('2')], memberCount: 4 }),
  buildGroup('g2', 'Dibujo', { capacity: 10, memberCount: 10 }),
  buildGroup('g3', 'Cálculo', {
    memberCount: 3,
    students: [student('on-1'), student('on-2'), student('off-1')],
  }),
  buildGroup('g4', 'Álgebra', { pendingRequests: [request('3')], memberCount: 2 }),
  buildGroup('g5', 'Biología'),
  buildGroup('g6', 'Español'),
  buildGroup('g7', 'Física'),
];

const ONLINE = new Set(['on-1', 'on-2']);

const CurrentPath = () => <p data-testid="ruta">{useLocation().pathname}</p>;

const renderModule = (groups: ClassGroup[] = SEVEN) =>
  render(
    <MemoryRouter initialEntries={['/teacher/groups']}>
      <ClassroomsContext.Provider
        value={buildClassroomsValue({ groups, onlineStudentIds: ONLINE })}
      >
        <TeacherGroupsModule groups={groups} teacherName="Prueba" />
        <CurrentPath />
      </ClassroomsContext.Provider>
    </MemoryRouter>
  );

/* Los nombres de la tabla, en el orden en que salen. */
const tableOrder = (): string[] =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map(
      (row) =>
        (row as HTMLTableRowElement).cells[1].querySelector('span.font-display')?.textContent ?? ''
    );

describe('TeacherGroupsModule con muchos salones', () => {
  it('con un solo salón ya hay herramientas y la lista por defecto', () => {
    renderModule(SEVEN.slice(0, 1));

    expect(screen.getByRole('searchbox', { name: SEARCH })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Vista' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('con siete la lista es la vista por defecto, ordenada por nombre', () => {
    renderModule();

    expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'true');
    expect(tableOrder()).toEqual([
      'Álgebra',
      'Biología',
      'Cálculo',
      'Dibujo',
      'Español',
      'Física',
      'Música',
    ]);
  });

  it('ordena por solicitudes, ocupación y conectados, y en empate por nombre', () => {
    renderModule();
    const sort = screen.getByLabelText('Ordenar salones');

    fireEvent.change(sort, { target: { value: 'pending' } });
    expect(tableOrder().slice(0, 3)).toEqual(['Música', 'Álgebra', 'Biología']);

    fireEvent.change(sort, { target: { value: 'occupancy' } });
    expect(tableOrder().slice(0, 3)).toEqual(['Dibujo', 'Música', 'Cálculo']);

    fireEvent.change(sort, { target: { value: 'online' } });
    expect(tableOrder().slice(0, 2)).toEqual(['Cálculo', 'Álgebra']);
  });

  it('«Con solicitudes» deja sólo los salones que tienen alguna', async () => {
    renderModule();
    const toggle = screen.getByRole('button', { name: 'Con solicitudes' });

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(tableOrder()).toEqual(['Álgebra', 'Música']);
  });

  it('sin coincidencias lo dice y «Quitar filtros» las vuelve a enseñar', async () => {
    renderModule();

    await userEvent.type(screen.getByRole('searchbox', { name: SEARCH }), 'química');
    expect(screen.getByText('Ningún salón coincide')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
    expect(tableOrder()).toHaveLength(7);
  });

  it('recuerda la vista elegida en un render nuevo', async () => {
    const { unmount } = renderModule();

    await userEvent.click(screen.getByRole('button', { name: 'Tarjetas' }));
    expect(window.localStorage.getItem(VIEW_KEY)).toBe('cards');
    unmount();

    renderModule();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarjetas' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getAllByRole('button', { name: 'Ver salón' })).toHaveLength(7);
  });

  it('el total de solicitudes va en las cifras y no junto al título', () => {
    renderModule(SEVEN.slice(0, 2));

    const stat = screen.getByText('Solicitudes en espera', { selector: 'dt' });
    expect(stat.nextElementSibling).toHaveTextContent('2');
    expect(screen.queryByText('2 en espera', { selector: 'h2 ~ span' })).not.toBeInTheDocument();
  });

  it('busca también por grado', async () => {
    renderModule([...SEVEN.slice(0, 2), { ...SEVEN[2], gradeLabel: 'Quinto de primaria' }]);

    await userEvent.type(screen.getByRole('searchbox', { name: SEARCH }), 'quinto');

    expect(tableOrder()).toEqual(['Cálculo']);
  });

  it('la franja de solicitudes lleva al salón', async () => {
    renderModule();

    const strip = screen.getByText('Solicitudes en espera', { selector: 'span' })
      .parentElement as HTMLElement;
    await userEvent.click(within(strip).getByRole('button', { name: /Álgebra/ }));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/teacher/groups/g4');
  });
});
