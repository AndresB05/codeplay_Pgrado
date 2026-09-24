import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import confetti from 'canvas-confetti';
import type { CatalogAchievement } from '../../../services/achievements.service';
import { StudentTrophiesModule } from './StudentTrophiesModule';

const logro = (over: Partial<CatalogAchievement>): CatalogAchievement => ({
  key: 'x',
  title: 'Logro',
  description: 'Descripción',
  iconName: 'trophy',
  awardedXp: 200,
  category: 'world',
  sortOrder: 1,
  unlockedAt: null,
  ...over,
});

/* Referencia estable, como la del hook real. */
const ACHIEVEMENTS: CatalogAchievement[] = [
  logro({
    key: 'perfect_world_1',
    title: 'Dueño del Sendero',
    unlockedAt: '2026-09-20T10:00:00.000Z',
  }),
  logro({ key: 'perfect_world_2', title: 'Dueño de la Cordillera', sortOrder: 2 }),
];

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../../../hooks/useAchievements', () => ({
  useAchievements: () => ({ achievements: ACHIEVEMENTS, loading: false, error: null }),
}));

describe('StudentTrophiesModule', () => {
  /*
   * Confeti sobre un trofeo en gris le diría al niño que ya lo ganó: sólo el
   * conseguido lleva el botón que lo lanza.
   */
  it('sólo el gran trofeo conseguido celebra', () => {
    render(<StudentTrophiesModule />);

    expect(
      screen.getByRole('button', { name: 'Celebrar el trofeo Dueño del Sendero' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Celebrar el trofeo Dueño de la Cordillera' })
    ).not.toBeInTheDocument();
  });

  it('lanza el confeti con el color del mundo y dorado, y respeta el movimiento reducido', async () => {
    render(<StudentTrophiesModule />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Celebrar el trofeo Dueño del Sendero' })
    );

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: ['#1F9D5B', '#FFC93C', '#FFE29A'],
        disableForReducedMotion: true,
      })
    );
  });
});
