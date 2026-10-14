import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { profileService } from './profile.service';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));

vi.mock('../lib/supabase', () => {
  const query = { select: () => query, eq: () => query, single: mocks.single };

  return { supabase: { rpc: mocks.rpc, from: () => query } };
});

const FALLO = { message: 'red caída', code: 'PGRST000' };

describe('profileService: explicaciones de mundo', () => {
  it('devuelve los mundos vistos', async () => {
    mocks.single.mockResolvedValue({ data: { seen_world_intros: ['world-3'] }, error: null });

    const result = await profileService.getSeenWorldIntros('user-1');

    expect(result).toEqual({ data: ['world-3'], error: null });
  });

  it('un fallo al leer sale como AppError y no lanza', async () => {
    mocks.single.mockResolvedValue({ data: null, error: FALLO });

    const result = await profileService.getSeenWorldIntros('user-1');

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(AppError);
  });

  it('anota el mundo por la función del servidor', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    const result = await profileService.markWorldIntroSeen('world-3');

    expect(mocks.rpc).toHaveBeenCalledWith('mark_world_intro_seen', { input_world_id: 'world-3' });
    expect(result).toEqual({ data: null, error: null });
  });

  it('un fallo al anotar sale como AppError y no lanza', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: FALLO });

    const result = await profileService.markWorldIntroSeen('world-3');

    expect(result.error).toBeInstanceOf(AppError);
  });
});
