import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/auth/index.ts',
    'src/auth/adapter.ts',
    'src/auth/core.ts',
    'src/auth/providers.ts',
    'src/auth/memoryAdapter.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
});
