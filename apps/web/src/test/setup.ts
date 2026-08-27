import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * `config/env.ts` valida con zod y lanza al importarse, y el store de salones
 * ya alcanza esa cadena a través del servicio. Sin estos valores la suite
 * dependería del `.env` de cada máquina, que no está en el repositorio: pasaría
 * en local y moriría en CI.
 */
vi.stubEnv('VITE_SUPABASE_URL', 'https://tests.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'clave-de-pruebas');

/**
 * jsdom conserva el documento y el almacenamiento entre tests del mismo
 * archivo, así que sin esto un test hereda lo que dejó el anterior.
 */
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
