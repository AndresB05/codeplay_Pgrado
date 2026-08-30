import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MissionAssignment } from '../../../services/missions.service';
import { AssignedMissionsPanel } from './AssignedMissionsPanel';

const mocks = vi.hoisted(() => ({
  listAssignments: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'kid-1' } }),
}));

vi.mock('../../../services/missions.service', () => ({
  missionsService: {
    listAssignments: mocks.listAssignments,
    assignMission: vi.fn(),
    unassignMission: vi.fn(),
  },
}));

const buildAssignment = (missionKey: string): MissionAssignment => ({
  id: `assignment-${missionKey}`,
  groupId: 'group-1',
  missionKey,
  assignedAt: '2026-08-29T10:00:00.000Z',
});

describe('AssignedMissionsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mocks.listAssignments.mockResolvedValue({ data: [buildAssignment('m1')], error: null });

    render(<AssignedMissionsPanel />);

    expect(await screen.findByText('La ruta del leopardo')).toBeInTheDocument();
    expect(screen.getByText('+300 XP')).toBeInTheDocument();
  });

  it('no ofrece ningún control para jugarla y dice que llega con el juego', async () => {
    mocks.listAssignments.mockResolvedValue({ data: [buildAssignment('m1')], error: null });

    const { container } = render(<AssignedMissionsPanel />);

    await screen.findByText('La ruta del leopardo');

    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(screen.getByText(/llegará con el juego/i)).toBeInTheDocument();
  });

  /*
   * `mission_key` es texto sin clave ajena, así que la base puede devolver una
   * clave que el catálogo ya no tenga. Se descarta, no se pinta a medias.
   */
  it('descarta una clave que no está en el catálogo', async () => {
    mocks.listAssignments.mockResolvedValue({
      data: [buildAssignment('m1'), buildAssignment('mision-fantasma')],
      error: null,
    });

    render(<AssignedMissionsPanel />);

    await screen.findByText('La ruta del leopardo');

    expect(screen.getByText('1 misión especial')).toBeInTheDocument();
  });
});
