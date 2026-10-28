import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/*
 * Lo que en Vercel hace el `rewrites` de `vercel.json`, en el Apache de la
 * universidad: sin él, recargar cualquier ruta que no sea la portada da 404.
 * Sólo se emite cuando la app no vive en la raíz, que es el caso de ese
 * servidor; `FallbackResource` es lo que permite su `AllowOverride`.
 */
const apacheFallback = (): Plugin => {
  let base = '/';
  return {
    name: 'apache-fallback',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    generateBundle() {
      if (base === '/') return;
      this.emitFile({
        type: 'asset',
        fileName: '.htaccess',
        source: `FallbackResource ${base}index.html\n`,
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), apacheFallback()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
