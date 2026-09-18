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
  world_title: 'Selva Algorítmica',
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

describe('studentProgressService.getCatalogSize', () => {
  it('cuenta los niveles publicados y cuántos mundos distintos los agrupan', async () => {
    mocks.from.mockImplementation(() =>
      respondWith({
        data: [
          { world_id: 'w1' },
          { world_id: 'w1' },
          { world_id: 'w1' },
          { world_id: 'w2' },
          { world_id: 'w2' },
        ],
        error: null,
      })
    );

    const { data } = await studentProgressService.getCatalogSize();

    expect(data).toEqual({ levels: 5, worlds: 2 });
  });
});
