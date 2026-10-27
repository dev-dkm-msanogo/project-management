import { defineConfig } from 'tsup';

// Bundle de production : esbuild résout les alias de chemins du tsconfig
// (@domain, @application, @infrastructure, @shared) et produit un ESM unique.
export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  clean: true,
  sourcemap: true,
  minify: false,
});
