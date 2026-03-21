import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const entryPoints = [
  'src/auth/index.ts',
  'src/auth/adapters/index.ts',
  'src/auth/adapters/memory.ts',
  'src/auth/adapters/mongoose.ts',
  'src/auth/core/index.ts',
  'src/auth/providers/index.ts',
  'src/auth/security/index.ts'
];

async function run() {
  console.log('Cleaning dist...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  console.log('Building ESM...');
  await build({
    entryPoints,
    bundle: false,
    outdir: 'dist',
    format: 'esm',
    outExtension: { '.js': '.js' },
    platform: 'node',
    sourcemap: true,
  });

  console.log('Building CJS...');
  await build({
    entryPoints,
    bundle: false,
    outdir: 'dist',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    platform: 'node',
    sourcemap: true,
  });

  console.log('Generating types...');
  // Use tsc with a dedicated config for the library to ensure clean types in dist/
  execSync('npx tsc --project tsconfig.lib.json', { stdio: 'inherit' });
  
  console.log('Build complete!');
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
