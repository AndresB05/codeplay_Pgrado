import { describe, expect, it, vi } from 'vitest';
import { studentProgressService } from './studentProgress.service';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('../lib/supabase', () => ({ supabase: { from: mocks.from } }));

/**
 * Constructor de consulta al gusto de PostgREST: cada método devuelve el mismo
 * objeto y el `await` final resuelve la respuesta, que es lo que el servicio
 * espera. Así el test describe lo que el servicio hace con lo que le llega, sin
 * atarse al orden en que encadena los filtros.
 */
const respondWith = <T>(response: { data: T[] | null; error: unknown }) => {
  const builder: Record<string, unknown> = {};

  ['select', 'eq', 'order'].forEach((method) => {
    builder[method] = vi.fn(() => builder);
  });

  builder.then = (resolve: (value: unknown) => unknown) => resolve(response);

  return builder;
};

const PROGRESS_ROW = {
  student_id: 's1',
  group_id: 'g1',
  level_id: 'l1',
  world_id: 'w1',
  level_title: 'Nivel 1 - Siempre adelante',
  level_sort_order: 1,
  world_title: 'Sendero de los Patrones',
  world_sort_order: 1,
  completion_status: 'completed',
  best_score: 100,
  attempt_count: 5,
  completed_at: '2026-09-03T01:28:52.736Z',
  last_attempt_at: '2026-09-18T01:43:30.792Z',
  optimal_steps: 4,
};

const ATTEMPT_ROW = {
  attempt_id: 'a1',
  student_id: 's1',
  group_id: 'g1',
  level_id: 'l1',
  world_id: 'w1',
  is_success: true,
  score: 100,
  steps: 4,
  optimal_steps: 4,
  created_at: '2026-09-03T01:28:31.925Z',
};

const stubViews = (progress: unknown[], attempts: unknown[]): void => {
  mocks.from.mockImplementation((table: string) =>
    table === 'classroom_level_progress'
      ? respondWith({ data: progress, error: null })
      : respondWith({ data: attempts, error: null })
  );
};

describe('studentProgressService.getDetail', () => {
  it('agrupa las partidas por el nivel al que pertenecen', async () => {
    stubViews(
      [PROGRESS_ROW, { ...PROGRESS_ROW, level_id: 'l2', level_sort_order: 2 }],
      [
        ATTEMPT_ROW,
        { ...ATTEMPT_ROW, attempt_id: 'a2', steps: 32, score: 13 },
        { ...ATTEMPT_ROW, attempt_id: 'a3', level_id: 'l2' },
      ]
    );

    const { data } = await studentProgressService.getDetail('s1');

    expect(data?.levels).toHaveLength(2);
    expect(data?.attemptsByLevel.l1.map((attempt) => attempt.steps)).toEqual([4, 32]);
    expect(data?.attemptsByLevel.l2).toHaveLength(1);
  });

  /*
   * El caso que motiva que `steps` sea anulable de punta a punta: el servidor
   * devuelve `null` para un programa que no sabe leer, y un cero diría que se
   * resolvió sin hacer nada.
   */
  it('conserva el null de una partida cuyo programa el servidor no supo leer', async () => {
    stubViews([PROGRESS_ROW], [{ ...ATTEMPT_ROW, steps: null }]);

    const { data } = await studentProgressService.getDetail('s1');

    expect(data?.attemptsByLevel.l1[0].steps).toBeNull();
  });

  it('conserva el null del nivel que no declara óptimo', async () => {
    stubViews([{ ...PROGRESS_ROW, optimal_steps: null }], []);

    const { data } = await studentProgressService.getDetail('s1');

    expect(data?.levels[0].optimalSteps).toBeNull();
  });

  it('marca como no superado el nivel que sólo está empezado', async () => {
    stubViews([{ ...PROGRESS_ROW, completion_status: 'in_progress', best_score: 0 }], []);

    const { data } = await studentProgressService.getDetail('s1');

    expect(data?.levels[0].completed).toBe(false);
  });

  it('devuelve el caso vacío sin error para quien no ha jugado', async () => {
    stubViews([], []);

    const { data, error } = await studentProgressService.getDetail('s1');

    expect(error).toBeNull();
    expect(data).toEqual({ levels: [], attemptsByLevel: {} });
  });

  it('traduce al español el rechazo por permisos', async () => {
    mocks.from.mockImplementation(() =>
      respondWith({ data: null, error: { code: '42501', message: 'permission denied' } })
    );

    const { data, error } = await studentProgressService.getDetail('ajeno');

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
    expect(error?.message).toBe('No tienes permiso para ver el avance de este explorador.');
  });
});

describe('studentProgressService.getClassroomDetail', () => {
  it('pide las dos vistas por el salón, no por el explorador', async () => {
    const builders: Record<string, ReturnType<typeof respondWith>> = {};

    mocks.from.mockImplementation((table: string) => {
      builders[table] = respondWith({ data: [], error: null });

      return builders[table];
    });

    await studentProgressService.getClassroomDetail('g1');

    expect(builders.classroom_level_progress.eq).toHaveBeenCalledWith('group_id', 'g1');
    expect(builders.classroom_level_attempts.eq).toHaveBeenCalledWith('group_id', 'g1');
  });

  it('separa el avance de cada explorador y agrupa sus partidas por nivel', async () => {
    stubViews(
      [PROGRESS_ROW, { ...PROGRESS_ROW, student_id: 's2' }],
      [
        ATTEMPT_ROW,
        { ...ATTEMPT_ROW, attempt_id: 'a2', steps: 32 },
        { ...ATTEMPT_ROW, attempt_id: 'a3', student_id: 's2' },
      ]
    );

    const { data } = await studentProgressService.getClassroomDetail('g1');

    expect(Object.keys(data ?? {}).sort()).toEqual(['s1', 's2']);
    expect(data?.s1.attemptsByLevel.l1.map((attempt) => attempt.attemptId)).toEqual(['a1', 'a2']);
    expect(data?.s2.attemptsByLevel.l1.map((attempt) => attempt.attemptId)).toEqual(['a3']);
    expect(data?.s2.levels).toHaveLength(1);
  });

  it('devuelve error y ningún dato si falla cualquiera de las dos vistas', async () => {
    mocks.from.mockImplementation((table: string) =>
      table === 'classroom_level_attempts'
        ? respondWith({ data: null, error: { code: '42501', message: 'permission denied' } })
        : respondWith({ data: [PROGRESS_ROW], error: null })
    );

    const { data, error } = await studentProgressService.getClassroomDetail('g1');

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('studentProgressService.getCatalog', () => {
  const stubCatalog = (worlds: unknown[], levels: unknown[]): void => {
    mocks.from.mockImplementation((table: string) =>
      table === 'worlds'
        ? respondWith({ data: worlds, error: null })
        : respondWith({ data: levels, error: null })
    );
  };

  it('devuelve los mundos publicados con sus niveles, en el orden en que llegan', async () => {
    stubCatalog(
      [
        { id: 'w1', title: 'Sendero de los Patrones' },
        { id: 'w2', title: 'Cordillera de la Abstracción' },
      ],
      [
        { id: 'w1-l1', world_id: 'w1', title: 'Siempre adelante' },
        { id: 'w2-l1', world_id: 'w2', title: 'Salta y sube' },
        { id: 'w1-l2', world_id: 'w1', title: 'Camino con curvas' },
      ]
    );

    const { data } = await studentProgressService.getCatalog();

    expect(data).toEqual([
      {
        worldId: 'w1',
        title: 'Sendero de los Patrones',
        levels: [
          { levelId: 'w1-l1', title: 'Siempre adelante' },
          { levelId: 'w1-l2', title: 'Camino con curvas' },
        ],
      },
      { worldId: 'w2', title: 'Cordillera de la Abstracción', levels: [{ levelId: 'w2-l1', title: 'Salta y sube' }] },
    ]);
  });

  /*
   * Contarlo subiría el denominador del panel por encima de lo que el servidor
   * cuenta: un mundo sin niveles publicados no puede terminarse.
   */
  it('deja fuera un mundo publicado que todavía no tiene niveles', async () => {
    stubCatalog(
      [
        { id: 'w1', title: 'Sendero de los Patrones' },
        { id: 'w9', title: 'Mundo en preparación' },
      ],
      [{ id: 'w1-l1', world_id: 'w1', title: 'Siempre adelante' }]
    );

    const { data } = await studentProgressService.getCatalog();

    expect(data).toHaveLength(1);
    expect(data?.[0]?.worldId).toBe('w1');
  });

  it('devuelve el error si falla cualquiera de las dos lecturas', async () => {
    mocks.from.mockImplementation((table: string) =>
      table === 'worlds'
        ? respondWith({ data: [{ id: 'w1', title: 'Sendero de los Patrones' }], error: null })
        : respondWith({ data: null, error: { code: '42501', message: 'permission denied' } })
    );

    const { data, error } = await studentProgressService.getCatalog();

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });
});
