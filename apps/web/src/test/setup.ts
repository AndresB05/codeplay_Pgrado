import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * jsdom conserva el documento y el almacenamiento entre tests del mismo
 * archivo, así que sin esto un test hereda los salones que dejó el anterior.
 */
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
