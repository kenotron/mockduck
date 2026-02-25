import { build } from 'esbuild';
import { chmodSync } from 'fs';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/nano-banana.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  minify: false,
  // pngjs uses dynamic requires internally; mark as external to avoid issues,
  // but since we want a fully self-contained bundle we inline it via the loader
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

chmodSync('dist/nano-banana.js', 0o755);
console.log('Built: dist/nano-banana.js');
