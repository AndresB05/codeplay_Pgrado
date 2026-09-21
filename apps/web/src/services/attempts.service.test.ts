import { describe, expect, it, vi } from 'vitest';
import { attemptsService } from './attempts.service';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('../lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }));

/** Lo que `submit_level_attempt` devuelve cuando todo va bien. */
const RESPUESTA_BASE = {
  attempt_id: 'attempt-1',
  score: 100,
  steps: 12,
  best_score: 100,
  completion_status: 'completed',
  attempt_count: 3,
  awarded_xp: 40,
  total_xp: 2500,
  unlocked_achievements: [],
  achievements_error: null,
  streak: { current: 2, max: 5, last_day: '2026-09-20' },
};

const responder = (extra: Record<string, unknown>) => {
  mocks.rpc.mockResolvedValue({ data: { ...RESPUESTA_BASE, ...extra }, error: null });
};

const guardar = () => attemptsService.submitAttempt('level-1', true, '{}', 1200, {});

describe('attemptsService.submitAttempt', () => {
  /*
   * LAS MISIONES SE LEEN BLANDAS, igual que los logros, y la diferencia con el
   * resto de la respuesta es deliberada: sin ellas la partida se guardó, se
   * puntuó y pagó su XP —el `total_xp` de al lado ya las incluye—, y lo único
   * que se pierde es un aviso. Dar la partida por perdida por eso sería cambiar
   * algo importante por algo que no lo es.
   */
  it('lee las misiones cumplidas que vengan bien formadas', async () => {
    responder({
      completed_missions: [
        {
          key: 'clear_world_1',
          title: 'Recorre el Sendero',
          description: 'Supera los tres niveles.',
          awarded_xp: 300,
        },
      ],
    });

    const { data } = await guardar();

    expect(data?.completedMissions).toEqual([
      {
        key: 'clear_world_1',
        title: 'Recorre el Sendero',
        description: 'Supera los tres niveles.',
        awardedXp: 300,
      },
    ]);
  });

  it('sin el campo devuelve lista vacía y la partida sigue valiendo', async () => {
    responder({});

    const { data, error } = await guardar();

    expect(error).toBeNull();
    expect(data?.completedMissions).toEqual([]);
    expect(data?.score).toBe(100);
    expect(data?.totalXp).toBe(2500);
  });

  it('con basura en el campo devuelve lista vacía en vez de romper', async () => {
    responder({ completed_missions: 'esto no es una lista' });

    const { data, error } = await guardar();

    expect(error).toBeNull();
    expect(data?.completedMissions).toEqual([]);
  });

  /*
   * Una misión sin clave o sin título no se puede anunciar, así que se descarta
   * ella sola: las que sí vengan bien se siguen enseñando.
   */
  it('descarta la misión mal formada y conserva las demás', async () => {
    responder({
      completed_missions: [
        { title: 'Sin clave' },
        { key: 'clear_world_2', title: 'Cruza la Cordillera' },
      ],
    });

    const { data } = await guardar();

    expect(data?.completedMissions).toEqual([
      {
        key: 'clear_world_2',
        title: 'Cruza la Cordillera',
        description: '',
        awardedXp: 0,
      },
    ]);
  });

  /* Sin puntuación no hay nada que enseñar, y eso sí invalida la respuesta. */
  it('una respuesta sin puntuación se trata como un guardado fallido', async () => {
    mocks.rpc.mockResolvedValue({
      data: { ...RESPUESTA_BASE, score: 'cien' },
      error: null,
    });

    const { data, error } = await guardar();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
