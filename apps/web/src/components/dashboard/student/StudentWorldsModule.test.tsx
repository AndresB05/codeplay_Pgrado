import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { World } from '../../../types/world.types';
import { StudentWorldsModule } from './StudentWorldsModule';

const buildWorld = (id: string, name: string, regionLabel: string, orderIndex: number): World => ({
  accentColor: 'mint',
  createdAt: '2026-09-01T00:00:00.000Z',
  description: `Descripción de ${name}`,
  id,
  isPublished: true,
  mascot: 'leopardo',
  name,
  orderIndex,
  regionLabel,
  slug: id,
  themeColor: 'jungle',
});

const WORLDS: World[] = [
  buildWorld('w1', 'Sendero de los Patrones', 'Algoritmos y patrones', 1),
  buildWorld('w2', 'Cordillera de la Abstracción', 'Descomposición y abstracción', 2),
  buildWorld('w3', 'Encrucijada de las Decisiones', 'Evaluación de problemas', 3),
];

/*
 * Referencias estables, como las de los hooks reales: la pantalla vuelve a pedir
 * las estadísticas cuando cambian, y un array nuevo en cada render la dejaría en
 * bucle.
 */
const NO_PROGRESS: never[] = [];

vi.mock('../../../hooks/useWorlds', () => ({
  useWorlds: () => ({ worlds: WORLDS, loading: false, error: null }),
}));

vi.mock('../../../hooks/useProgress', () => ({
  useProgress: () => ({ progress: NO_PROGRESS }),
}));

/* Sin esto el módulo arrastra `lib/supabase`, que valida el entorno al importarse. */
vi.mock('../../../services/worlds.service', () => ({
  worldsService: { getLevelsByWorld: vi.fn().mockResolvedValue({ data: [], error: null }) },
}));

vi.mock('../../../services/classrooms.service', () => ({
  FALLBACK_STUDENT_NAME: 'Explorador',
}));

vi.mock('../shared/AssignedMissionsPanel', () => ({
  AssignedMissionsPanel: () => null,
}));

const renderModule = () =>
  render(
    <MemoryRouter>
      <StudentWorldsModule user={null} />
    </MemoryRouter>
  );

/* La etiqueta envuelve el desplegable, así que su nombre accesible arranca por ella. */
const filter = (label: string): HTMLElement =>
  screen.getByRole('combobox', { name: new RegExp(`^${label}`) });

const visibleWorlds = (): string[] =>
  WORLDS.map((world) => world.name).filter((name) => screen.queryByText(name) !== null);

describe('StudentWorldsModule', () => {
  it('enseña los tres mundos al entrar, cada uno con la dificultad de su orden', () => {
    renderModule();

    expect(visibleWorlds()).toHaveLength(3);

    const card = screen.getByText('Encrucijada de las Decisiones').closest('button');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText('Difícil')).toBeInTheDocument();
  });

  it('cada uno de los tres mundos lleva su ilustración en la cabecera', () => {
    renderModule();

    const images = WORLDS.map(
      (world) => screen.getByText(world.name).closest('button')?.querySelector('img')?.src
    );

    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(3);
  });

  it('el filtro de dificultad deja sólo el mundo de esa dificultad', async () => {
    renderModule();

    await userEvent.selectOptions(filter('Dificultad'), 'Intermedio');

    expect(visibleWorlds()).toEqual(['Cordillera de la Abstracción']);
  });

  it('el filtro de tema ofrece los pilares de los mundos y filtra por ellos', async () => {
    renderModule();

    await userEvent.selectOptions(filter('Tema'), 'Evaluación de problemas');

    expect(visibleWorlds()).toEqual(['Encrucijada de las Decisiones']);
  });

  it('una combinación sin mundos lo dice en vez de dejar la lista en blanco', async () => {
    renderModule();

    await userEvent.selectOptions(filter('Dificultad'), 'Fácil');
    await userEvent.selectOptions(filter('Tema'), 'Evaluación de problemas');

    expect(visibleWorlds()).toEqual([]);
    expect(screen.getByText(/Ningún mundo coincide/)).toBeInTheDocument();
  });
});
