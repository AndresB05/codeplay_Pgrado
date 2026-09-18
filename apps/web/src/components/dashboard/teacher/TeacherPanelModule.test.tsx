import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MissionAssignment } from '../../../services/missions.service';
import type { ClassGroup } from '../../../types/classroom.types';
import { ClassroomsContext } from '../../../context/ClassroomsContext';
import { buildClassroomsValue } from '../../../test/buildClassroomsValue';
import { TeacherPanelModule } from './TeacherPanelModule';

const mocks = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  getCatalogSize: vi.fn(),
  getDetail: vi.fn(),
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

/*
 * Se dobla el servicio entero, y no sólo por aislar: sin esto el módulo arrastra
 * `lib/supabase`, que valida las variables de entorno **al importarse**. En esta
 * máquina pasaría por el `.env` de `apps/web`, pero el paso `test:run` de CI no
 * las declara —sólo el de `build` lo hace—, así que el test rojo aparecería
 * allí y no aquí.
 */
vi.mock('../../../services/studentProgress.service', () => ({
  studentProgressService: {
    getCatalogSize: mocks.getCatalogSize,
    getDetail: mocks.getDetail,
  },
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

/*
 * El panel se monta DENTRO del contexto de salones, y no porque lea de él los
 * salones —ésos siguen llegando por prop—: desde `panel-al-dia` pide al abrirse
 * que el store se ponga al día, y eso exige el proveedor. Montarlo suelto
 * describía un componente que ya no existe.
 */
const renderPanel = (
  groups: ClassGroup[],
  initialGroupId: string | null,
  store = buildClassroomsValue({ groups })
) =>
  render(
    <ClassroomsContext.Provider value={store}>
      <TeacherPanelModule groups={groups} initialGroupId={initialGroupId} />
    </ClassroomsContext.Provider>
  );

describe('TeacherPanelModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    /* Por defecto, sin misiones asignadas: quien necesite otra cosa lo redefine. */
    mocks.listAssignments.mockResolvedValue({ data: [], error: null });
    mocks.getCatalogSize.mockResolvedValue({ data: { levels: 9, worlds: 3 }, error: null });
    mocks.getDetail.mockResolvedValue({ data: { levels: [], attemptsByLevel: {} }, error: null });
  });

  /*
   * El panel enseña progreso, y el progreso no llega por la suscripción. Sin
   * esta petición, quien navega a este panel dentro de la aplicación ve lo que
   * hubiera cuando ésta arrancó: el proveedor vive en la raíz y no se desmonta
   * al cambiar de pantalla.
   */
  describe('puesta al día al abrirse', () => {
    it('pide al store que se ponga al día, sin declarar espera', async () => {
      const store = buildClassroomsValue({ groups: TWO_GROUPS });

      renderPanel(TWO_GROUPS, null, store);

      await waitFor(() => {
        expect(store.refreshSilently).toHaveBeenCalled();
      });
    });

    it('no la pide mientras el store ya está cargando', async () => {
      const store = buildClassroomsValue({ groups: TWO_GROUPS, loading: true });

      renderPanel(TWO_GROUPS, null, store);

      await waitFor(() => {
        expect(screen.getByText(/Panel de información/)).toBeInTheDocument();
      });

      expect(store.refreshSilently).not.toHaveBeenCalled();
    });
  });

  describe('asignación de misiones según el alcance', () => {
    it('marca «Asignada» sólo si la tienen todos los salones del alcance', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1'), buildAssignment('g2', 'm1')],
        error: null,
      });

      renderPanel(TWO_GROUPS, null);

      await waitFor(() => {
        expect(missionButton()).toHaveTextContent('Asignada');
      });
    });

    it('con la misión en unos salones y no en otros dice en cuántos está', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      renderPanel(TWO_GROUPS, null);

      expect(await screen.findByText('Asignada en 1 de 2 salones.')).toBeInTheDocument();
      expect(missionButton()).toHaveTextContent('Asignar en los demás');
    });

    it('un salón elegido no hereda lo asignado en el otro', async () => {
      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      renderPanel(TWO_GROUPS, 'g2');

      await waitFor(() => {
        expect(missionButton()).toHaveTextContent('Asignar misión');
      });
    });

    it('sin ningún salón deja los botones deshabilitados y dice por qué', async () => {
      mocks.listAssignments.mockResolvedValue({ data: [], error: null });

      renderPanel([], null);

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

      renderPanel(TWO_GROUPS, null);

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
            attemptedLevels: 0,
            completedLevels: 0,
            completedWorlds: 0,
            totalAttempts: 0,
            averageBestScore: null,
          },
        ],
      };

      mocks.listAssignments.mockResolvedValue({
        data: [buildAssignment('g1', 'm1')],
        error: null,
      });

      renderPanel([groupWithStudents], 'g1');

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

      renderPanel([buildGroup('g1', 'Salón A')], 'g1');

      expect(await screen.findByText(/todavía no tiene exploradores inscritos/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
