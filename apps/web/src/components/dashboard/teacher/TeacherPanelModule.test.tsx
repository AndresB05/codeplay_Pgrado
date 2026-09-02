import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MissionAssignment } from '../../../services/missions.service';
import type { ClassGroup } from '../../../types/classroom.types';
import { TeacherPanelModule } from './TeacherPanelModule';

const mocks = vi.hoisted(() => ({
  listAssignments: vi.fn(),
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
  useAuth: () => ({ user: { id: 'tutor-1' } }),
}));

vi.mock('../../../services/missions.service', () => ({
  missionsService: {
    listAssignments: mocks.listAssignments,
    assignMission: vi.fn(),
    unassignMission: vi.fn(),
    subscribeToAssignments: mocks.subscribeToAssignments,
  },
}));

const buildGroup = (id: string, name: string): ClassGroup => ({
  id,
  publicId: `CP-${id.toUpperCase()}`,
  name,
  gradeLabel: 'Cuarto',
  teacherName: 'Prueba',
  capacity: 20,
  memberCount: 0,
  students: [],
  pendingRequests: [],
});

const buildAssignment = (groupId: string, missionKey: string): MissionAssignment => ({
  id: `${groupId}-${missionKey}`,
  groupId,
  missionKey,
  assignedAt: '2026-08-29T10:00:00.000Z',
});

const TWO_GROUPS = [buildGroup('g1', 'Salón A'), buildGroup('g2', 'Salón B')];

/** El botón de la tarjeta de «La ruta del leopardo», que es la primera. */
const missionButton = (): HTMLButtonElement => {
  const heading = screen.getByText('La ruta del leopardo');
  const card = heading.closest('article');

  if (!card) {
    throw new Error('La tarjeta de la misión no está en la pantalla.');
  }

  const button = card.querySelector('button');

  if (!button) {
    throw new Error('La tarjeta de la misión no tiene botón.');
  }

  return button;
};

describe('TeacherPanelModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('asignación de misiones según el alcance', () => {
    it('marca «Asignada» sólo si la tienen todos los salones del alcance', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1'), buildAssignment('g2', 'm1')],
        error: null,
      });

      render(<TeacherPanelModule groups={TWO_GROUPS} initialGroupId={null} />);

      await waitFor(() => {
        expect(missionButton()).toHaveTextContent('Asignada');
      });
    });

    it('con la misión en unos salones y no en otros dice en cuántos está', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      render(<TeacherPanelModule groups={TWO_GROUPS} initialGroupId={null} />);

      expect(await screen.findByText('Asignada en 1 de 2 salones.')).toBeInTheDocument();
      expect(missionButton()).toHaveTextContent('Asignar en los demás');
    });

    it('un salón elegido no hereda lo asignado en el otro', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      render(<TeacherPanelModule groups={TWO_GROUPS} initialGroupId="g2" />);

      await waitFor(() => {
        expect(missionButton()).toHaveTextContent('Asignar misión');
      });
    });

    it('sin ningún salón deja los botones deshabilitados y dice por qué', async () => {
      mocks.listAssignments.mockResolvedValue({ data: [], error: null });

      render(<TeacherPanelModule groups={[]} initialGroupId={null} />);

      await waitFor(() => {
        expect(missionButton()).toBeDisabled();
      });

      expect(screen.getByText(/Todavía no tienes ningún salón/i)).toBeInTheDocument();
    });
  });

  describe('apartado de quién ha cumplido', () => {
    it('no aparece con «Todos» elegido, porque mezclaría salones', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1'), buildAssignment('g2', 'm1')],
        error: null,
      });

      render(<TeacherPanelModule groups={TWO_GROUPS} initialGroupId={null} />);

      await screen.findByText('La ruta del leopardo');

      expect(screen.queryByText('Quién ha cumplido')).not.toBeInTheDocument();
    });

    it('con un salón elegido saca a cada explorador en pendiente y explica el motivo', async () => {
      const groupWithStudents: ClassGroup = {
        ...buildGroup('g1', 'Salón A'),
        memberCount: 1,
        students: [
          {
            id: 'kid-1',
            name: 'Nina Prueba',
            initials: 'NP',
            avatarTone: 'bg-grape',
            currentWorld: null,
            hoursSinceLastActivity: null,
            streakDays: null,
            xp: 0,
            skills: {
              sequences: 0,
              loops: 0,
              conditionals: 0,
              debugging: 0,
              decomposition: 0,
            },
          },
        ],
      };

      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      render(<TeacherPanelModule groups={[groupWithStudents]} initialGroupId="g1" />);

      expect(await screen.findByText('Quién ha cumplido')).toBeInTheDocument();
      expect(screen.getByText('Nina Prueba')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText(/hasta que el juego reporte el progreso/i)).toBeInTheDocument();
    });

    it('un salón sin exploradores lo dice en vez de enseñar una tabla vacía', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      render(<TeacherPanelModule groups={[buildGroup('g1', 'Salón A')]} initialGroupId="g1" />);

      expect(await screen.findByText(/todavía no tiene exploradores inscritos/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
