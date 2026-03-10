import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    treeshake: true,
    clean: true,
    external: ['react', 'react-dom'],
    sourcemap: true,
    minify: false,
  },
  {
    entry: ['src/server.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    external: ['react', 'react-dom'],
    sourcemap: true,
    minify: false,
  },
])
