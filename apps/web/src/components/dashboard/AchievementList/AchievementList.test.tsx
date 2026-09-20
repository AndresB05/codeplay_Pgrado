import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AchievementList } from './AchievementList';
import type { CatalogAchievement } from '../../../services/achievements.service';

const logro = (over: Partial<CatalogAchievement> = {}): CatalogAchievement => ({
  key: 'no_dizzy',
  title: 'Sin mareos',
  description: 'Da cuatro giros seguidos a la derecha y aun así llega a la meta.',
  iconName: 'compass',
  awardedXp: 100,
  category: 'action',
  sortOrder: 301,
  unlockedAt: null,
  ...over,
});

describe('AchievementList', () => {
  /*
   * Lo que el paso 22 cambió: la sala listaba SÓLO lo conseguido, así que a
   * quien no tenía nada le decía que no había logros —y hay veinte—.
   */
  it('enseña los que faltan, no sólo los ganados', () => {
    render(
      <AchievementList
        achievements={[
          logro(),
          logro({ key: 'trying_to_fly', title: 'Intentando volar', sortOrder: 302 }),
        ]}
      />
    );

    expect(screen.getByText('Sin mareos')).toBeInTheDocument();
    expect(screen.getByText('Intentando volar')).toBeInTheDocument();
    expect(screen.getAllByText('Por conseguir')).toHaveLength(2);
    expect(screen.getByText('Llevas 0 de 2.')).toBeInTheDocument();
  });

  it('distingue lo ganado con palabras y no sólo con el color', () => {
    render(
      <AchievementList
        achievements={[logro({ unlockedAt: '2026-09-18T15:00:00.000Z' }), logro({ key: 'x' })]}
      />
    );

    expect(screen.getByText('✨ Desbloqueado')).toBeInTheDocument();
    expect(screen.getByText('Por conseguir')).toBeInTheDocument();
    expect(screen.getByText('Llevas 1 de 2.')).toBeInTheDocument();
  });

  /*
   * El niño viene a ver lo suyo: con tres ganados entre veinte, dejarlos en el
   * orden del catálogo los entierra entre diecisiete casillas vacías.
   */
  it('pone lo conseguido delante, y dentro de cada mitad manda el catálogo', () => {
    render(
      <AchievementList
        achievements={[
          logro({ key: 'a', title: 'Pendiente pronto', sortOrder: 1 }),
          logro({ key: 'b', title: 'Pendiente tarde', sortOrder: 9 }),
          logro({ key: 'c', title: 'Ganado tarde', sortOrder: 8, unlockedAt: '2026-09-18T10:00:00Z' }),
          logro({ key: 'd', title: 'Ganado pronto', sortOrder: 2, unlockedAt: '2026-09-18T11:00:00Z' }),
        ]}
      />
    );

    const titulos = screen.getAllByRole('heading', { level: 4 }).map((node) => node.textContent);

    expect(titulos).toEqual([
      'Ganado pronto',
      'Ganado tarde',
      'Pendiente pronto',
      'Pendiente tarde',
    ]);
  });

  it('la fecha sólo acompaña a lo ganado', () => {
    render(<AchievementList achievements={[logro({ unlockedAt: '2026-09-18T15:00:00.000Z' })]} />);

    expect(screen.getByText(/18 de septiembre de 2026 · \+100 XP/)).toBeInTheDocument();
  });

  it('sin catálogo lo dice en vez de pintar una rejilla vacía', () => {
    render(<AchievementList achievements={[]} />);

    expect(screen.getByText(/Todavía no hay logros por aquí/)).toBeInTheDocument();
  });
});
