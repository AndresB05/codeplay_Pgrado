import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogWorld } from '../../../services/studentProgress.service';
import type { MissionAssignment } from '../../../services/missions.service';
import type { ClassGroup, ClassroomStudent } from '../../../types/classroom.types';
import { ClassroomsContext } from '../../../context/ClassroomsContext';
import { buildClassroomsValue } from '../../../test/buildClassroomsValue';
import { TeacherPanelModule } from './TeacherPanelModule';

const mocks = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  getCatalog: vi.fn(),
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
    getCatalog: mocks.getCatalog,
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

const buildStudent = (overrides: Partial<ClassroomStudent> = {}): ClassroomStudent => ({
  id: 'kid-1',
  name: 'Axoluk',
  initials: 'AX',
  avatarTone: 'bg-grape',
  currentWorld: 'Selva Algorítmica',
  hoursSinceLastActivity: 1,
  streakDays: null,
  xp: 0,
  attemptedLevels: 2,
  completedLevels: 2,
  completedWorlds: 0,
  totalAttempts: 2,
  averageBestScore: 100,
  ...overrides,
});

/* El catálogo sembrado que hay contra la base: tres mundos de tres niveles. */
const CATALOG: CatalogWorld[] = [
  {
    worldId: 'w1',
    title: 'Selva Algorítmica',
    levels: [
      { levelId: 'w1-l1', title: 'Siempre adelante' },
      { levelId: 'w1-l2', title: 'Camino con curvas' },
      { levelId: 'w1-l3', title: 'La escalera' },
    ],
  },
  {
    worldId: 'w2',
    title: 'Cordillera Binaria',
    levels: [
      { levelId: 'w2-l1', title: 'Salta y sube' },
      { levelId: 'w2-l2', title: 'El gran rodeo' },
      { levelId: 'w2-l3', title: 'La torre' },
    ],
  },
  {
    worldId: 'w3',
    title: 'Costa de Bugs',
    levels: [
      { levelId: 'w3-l1', title: 'Dos caminos' },
      { levelId: 'w3-l2', title: 'El faro' },
      { levelId: 'w3-l3', title: 'Muchos caminos' },
    ],
  },
];

/* Lo que Axoluk lleva jugado, medido contra la base: dos mundos por el nivel 1. */
const AXOLUK_DETAIL = {
  levels: [
    {
      levelId: 'w1-l1',
      levelTitle: 'Siempre adelante',
      worldId: 'w1',
      worldTitle: 'Selva Algorítmica',
      worldSortOrder: 1,
      levelSortOrder: 1,
      completed: true,
      bestScore: 100,
      attemptCount: 1,
      optimalSteps: 4,
    },
    {
      levelId: 'w3-l1',
      levelTitle: 'Dos caminos',
      worldId: 'w3',
      worldTitle: 'Costa de Bugs',
      worldSortOrder: 3,
      levelSortOrder: 1,
      completed: true,
      bestScore: 100,
      attemptCount: 1,
      optimalSteps: 10,
    },
  ],
  attemptsByLevel: {},
};

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
/* Deja leer en el DOM la dirección a la que el panel navega. */
const CurrentPath = () => <span data-testid="path">{useLocation().pathname}</span>;

const currentPath = (): string => screen.getByTestId('path').textContent ?? '';

/*
 * El alcance y el explorador llegan como props porque los lee `TeacherDashboard`
 * de la dirección; el panel sólo la ESCRIBE, y eso es lo que el enrutador de
 * aquí permite comprobar.
 */
const renderPanel = (
  groups: ClassGroup[],
  groupId: string | null,
  store = buildClassroomsValue({ groups }),
  studentId: string | null = null
) =>
  render(
    <MemoryRouter initialEntries={['/teacher/panel']}>
      <ClassroomsContext.Provider value={store}>
        <TeacherPanelModule groups={groups} groupId={groupId} studentId={studentId} />
        <CurrentPath />
      </ClassroomsContext.Provider>
    </MemoryRouter>
  );

describe('TeacherPanelModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    /* Por defecto, sin misiones asignadas: quien necesite otra cosa lo redefine. */
    mocks.listAssignments.mockResolvedValue({ data: [], error: null });
    mocks.getCatalog.mockResolvedValue({ data: CATALOG, error: null });
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

  describe('ficha del explorador', () => {
    const GROUP_WITH_AXOLUK: ClassGroup = {
      ...buildGroup('g1', 'Salón A'),
      memberCount: 2,
      students: [buildStudent(), buildStudent({ id: 'kid-2', name: 'Invitada Prueba', attemptedLevels: 0, completedLevels: 0, totalAttempts: 0, averageBestScore: null, hoursSinceLastActivity: null, currentWorld: null })],
    };

    beforeEach(() => {
      mocks.getDetail.mockImplementation((studentId: string) =>
        Promise.resolve({
          data: studentId === 'kid-1' ? AXOLUK_DETAIL : { levels: [], attemptsByLevel: {} },
          error: null,
        })
      );
    });

    it('nombra los tres mundos, también el que el explorador no ha tocado', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-1');

      expect(await screen.findByText('Cordillera Binaria')).toBeInTheDocument();
      expect(screen.getByText('Selva Algorítmica')).toBeInTheDocument();
      expect(screen.getByText('Costa de Bugs')).toBeInTheDocument();
    });

    it('nombra los niveles que nunca empezó, y los dice sin empezar', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-1');

      expect(await screen.findByText('La torre')).toBeInTheDocument();
      expect(screen.getByText('El faro')).toBeInTheDocument();
      /* Siete de los nueve: los dos que jugó llevan su marca. */
      expect(screen.getAllByText('Sin empezar')).toHaveLength(7);
    });

    it('cuenta sobre el catálogo y no sobre lo empezado', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-1');

      expect(await screen.findByText(/2 de 9 niveles superados/)).toBeInTheDocument();
      expect(screen.getByText(/0 de 3 mundos terminados/)).toBeInTheDocument();
    });

    it('da el recuento de cada mundo en su cabecera', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-1');

      await screen.findByText('Cordillera Binaria');

      expect(screen.getAllByText('1 de 3')).toHaveLength(2);
      expect(screen.getByText('0 de 3')).toBeInTheDocument();
    });

    it('a quien no ha jugado nada le enseña el catálogo entero y se lo dice', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-2');

      expect(
        await screen.findByText(/Invitada Prueba todavía no ha jugado ningún nivel/)
      ).toBeInTheDocument();
      expect(screen.getAllByText('Sin empezar')).toHaveLength(9);
    });

    /* «última actividad Sin actividad» era lo que salía, y no dice nada. */
    it('no habla de la última actividad de quien no tiene ninguna', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-2');

      expect(await screen.findByText(/0 de 9 niveles superados/)).toBeInTheDocument();
      expect(screen.queryByText(/última actividad/)).not.toBeInTheDocument();
    });

    it('una dirección con alguien que no está en el alcance no abre ficha', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'de-otro-salón');

      await screen.findByText('La ruta del leopardo');

      expect(screen.queryByText('Cordillera Binaria')).not.toBeInTheDocument();
      expect(mocks.getDetail).not.toHaveBeenCalled();
    });
  });

  describe('el alcance y el explorador viven en la dirección', () => {
    const GROUP_WITH_AXOLUK: ClassGroup = {
      ...buildGroup('g1', 'Salón A'),
      memberCount: 1,
      students: [buildStudent()],
    };

    it('elegir un explorador lo escribe en la dirección', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1');

      await userEvent.click(await screen.findByRole('button', { name: 'Axoluk' }));

      expect(currentPath()).toBe('/teacher/panel/g1/kid-1');
    });

    /* Con «Todos» hace falta un hueco que rellenar antes del explorador. */
    it('usa `all` en el tramo de salón cuando el alcance es todos', async () => {
      renderPanel([GROUP_WITH_AXOLUK], null);

      await userEvent.click(await screen.findByRole('button', { name: 'Axoluk' }));

      expect(currentPath()).toBe('/teacher/panel/all/kid-1');
    });

    it('volver a pulsarlo lo quita de la dirección', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Axoluk' }));

      expect(currentPath()).toBe('/teacher/panel/g1');
    });

    it('cambiar de alcance suelta al explorador', async () => {
      renderPanel([GROUP_WITH_AXOLUK, buildGroup('g2', 'Salón B')], 'g1', undefined, 'kid-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Salón B' }));

      expect(currentPath()).toBe('/teacher/panel/g2');
    });

    it('volver a «Todos» deja la dirección en el panel a secas', async () => {
      renderPanel([GROUP_WITH_AXOLUK], 'g1', undefined, 'kid-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Todos' }));

      expect(currentPath()).toBe('/teacher/panel');
    });
  });
});
