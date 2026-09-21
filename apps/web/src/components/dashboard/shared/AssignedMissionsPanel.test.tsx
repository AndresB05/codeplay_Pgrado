import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MissionAssignment, MissionCompletion } from '../../../services/missions.service';
import type { Mission } from '../../../types/classroom.types';
import { AssignedMissionsPanel } from './AssignedMissionsPanel';

const mocks = vi.hoisted(() => ({
  listCatalog: vi.fn(),
  listAssignments: vi.fn(),
  listCompletions: vi.fn(),
  /* Guarda al oyente para poder disparar un cambio como haría la base. */
  emit: null as null | (() => void),
  subscribeToAssignments: vi.fn((onChange: () => void) => {
    mocks.emit = onChange;

    return () => {
      mocks.emit = null;
    };
  }),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'kid-1' } }),
}));

vi.mock('../../../services/missions.service', () => ({
  missionsService: {
    listCatalog: mocks.listCatalog,
    listAssignments: mocks.listAssignments,
    listCompletions: mocks.listCompletions,
    assignMission: vi.fn(),
    unassignMission: vi.fn(),
    subscribeToAssignments: mocks.subscribeToAssignments,
  },
}));

/* El catálogo vive en la base desde que las misiones se pueden cumplir. */
const CATALOGO: Mission[] = [
  {
    key: 'clear_world_1',
    title: 'Recorre el Sendero',
    description: 'Supera los tres niveles del Sendero de los Patrones.',
    difficultyLabel: 'Fácil',
    xpReward: 300,
  },
  {
    key: 'clear_world_3',
    title: 'Resuelve la Encrucijada',
    description: 'Supera los tres niveles de la Encrucijada de las Decisiones.',
    difficultyLabel: 'Difícil',
    xpReward: 500,
  },
];

const buildAssignment = (missionKey: string): MissionAssignment => ({
  id: `assignment-${missionKey}`,
  groupId: 'group-1',
  missionKey,
  assignedAt: '2026-08-29T10:00:00.000Z',
  dueDate: null,
});

const buildCompletion = (missionKey: string, userId = 'kid-1'): MissionCompletion => ({
  userId,
  missionKey,
  groupId: 'group-1',
  awardedXp: 300,
  completedAt: '2026-09-20T10:00:00.000Z',
});

describe('AssignedMissionsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listCatalog.mockResolvedValue({ data: CATALOGO, error: null });
    mocks.listCompletions.mockResolvedValue({ data: [], error: null });
  });

  /*
   * Cubre de una vez los dos casos vivos: el niño sin salón, que no tiene tutor
   * que le asigne nada, y el que tiene salón y ninguna misión todavía. Los dos
   * llegan aquí como cero filas, porque el filtro por salón lo hace la RLS.
   */
  it('no pinta nada cuando no hay ninguna misión asignada', async () => {
    mocks.listAssignments.mockResolvedValue({ data: [], error: null });

    const { container } = render(<AssignedMissionsPanel />);

    await waitFor(() => {
      expect(mocks.listAssignments).toHaveBeenCalled();
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('pinta la misión asignada con el premio que da', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1')],
      error: null,
    });

    render(<AssignedMissionsPanel />);

    expect(await screen.findByText('Recorre el Sendero')).toBeInTheDocument();
    expect(screen.getByText('+300 XP')).toBeInTheDocument();
  });

  /*
   * La asignación es del salón y el cumplimiento de cada alumno: que uno la
   * cumpla no se la quita a nadie, y al que ya la cumplió le queda como lo que
   * ganó. Sigue sin haber botón, ahora porque una misión no se empieza: se
   * cumple jugando los niveles.
   */
  it('dice cuál está cumplida, y la cumplida no desaparece', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1'), buildAssignment('clear_world_3')],
      error: null,
    });
    mocks.listCompletions.mockResolvedValue({
      data: [buildCompletion('clear_world_1')],
      error: null,
    });

    const { container } = render(<AssignedMissionsPanel />);

    await screen.findByText('Recorre el Sendero');

    expect(screen.getByText(/¡Cumplida! Ganaste 300 XP/)).toBeInTheDocument();
    expect(screen.getByText('Resuelve la Encrucijada')).toBeInTheDocument();
    expect(screen.getByText('1 de 2 cumplidas')).toBeInTheDocument();
    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  /* En «Mundos» la cumplida sólo estorba: allí se va, y en «Mi salón» se queda. */
  it('con hideCompleted esconde la cumplida, y si no queda ninguna, el panel', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1'), buildAssignment('clear_world_3')],
      error: null,
    });
    mocks.listCompletions.mockResolvedValue({
      data: [buildCompletion('clear_world_1')],
      error: null,
    });

    const { unmount } = render(<AssignedMissionsPanel hideCompleted />);

    expect(await screen.findByText('Resuelve la Encrucijada')).toBeInTheDocument();
    expect(screen.queryByText('Recorre el Sendero')).not.toBeInTheDocument();
    unmount();

    mocks.listCompletions.mockResolvedValue({
      data: [buildCompletion('clear_world_1'), buildCompletion('clear_world_3')],
      error: null,
    });

    /*
     * Vacío también está mientras carga, así que el panel sin la opción, montado
     * al lado, es el que dice cuándo ya llegaron los datos.
     */
    render(
      <>
        <div data-testid="en-mundos">
          <AssignedMissionsPanel hideCompleted />
        </div>
        <AssignedMissionsPanel />
      </>
    );

    await screen.findByText('2 de 2 cumplidas');

    expect(screen.getByTestId('en-mundos')).toBeEmptyDOMElement();
  });

  /*
   * La RLS sólo le devuelve al niño lo suyo, pero el panel filtra igual por
   * usuario: el mismo hook lo usa el panel del tutor, donde vienen las de todos
   * sus alumnos.
   */
  it('lo que cumplió un compañero no sale como cumplido por él', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1')],
      error: null,
    });
    mocks.listCompletions.mockResolvedValue({
      data: [buildCompletion('clear_world_1', 'kid-2')],
      error: null,
    });

    render(<AssignedMissionsPanel />);

    await screen.findByText('Recorre el Sendero');

    expect(screen.queryByText(/¡Cumplida!/)).not.toBeInTheDocument();
    expect(screen.getByText('0 de 1 cumplidas')).toBeInTheDocument();
  });

  /*
   * `mission_key` ya tiene clave ajena, así que esto no debería ocurrir contra
   * la base real. El descarte se queda porque el catálogo y las asignaciones
   * son dos lecturas distintas y pueden llegar desfasadas.
   */
  it('descarta una clave que no está en el catálogo', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1'), buildAssignment('mision-fantasma')],
      error: null,
    });

    render(<AssignedMissionsPanel />);

    await screen.findByText('Recorre el Sendero');

    expect(screen.getByText('0 de 1 cumplidas')).toBeInTheDocument();
  });

  it('la misión que el tutor acaba de asignar aparece sin volver a montar', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1')],
      error: null,
    });

    render(<AssignedMissionsPanel />);
    await screen.findByText('Recorre el Sendero');

    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1'), buildAssignment('clear_world_3')],
      error: null,
    });

    await act(async () => {
      mocks.emit?.();
    });

    expect(screen.getByText('Resuelve la Encrucijada')).toBeInTheDocument();
    expect(screen.getByText('0 de 2 cumplidas')).toBeInTheDocument();
  });

  /*
   * Este panel no pinta nada mientras carga, así que declarar espera en una
   * recarga ajena no lo haría parpadear: lo haría DESAPARECER y volver. El
   * aserto tiene que caer mientras la consulta está en vuelo, porque al
   * terminar el panel ya volvió y un test que mire el final pasa igual.
   */
  it('un evento no hace desaparecer el panel mientras relee', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('clear_world_1')],
      error: null,
    });

    render(<AssignedMissionsPanel />);
    await screen.findByText('Recorre el Sendero');

    let releaseRead = (): void => {};

    mocks.listAssignments.mockReturnValue(
      new Promise((resolve) => {
        releaseRead = () => {
          resolve({
            data: [buildAssignment('clear_world_1'), buildAssignment('clear_world_3')],
            error: null,
          });
        };
      })
    );

    act(() => {
      mocks.emit?.();
    });

    /* La consulta está a medias y el panel sigue en pie. */
    expect(screen.getByText('Recorre el Sendero')).toBeInTheDocument();

    await act(async () => {
      releaseRead();
    });

    expect(screen.getByText('Resuelve la Encrucijada')).toBeInTheDocument();
  });
});
