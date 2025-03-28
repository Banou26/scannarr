import { defineConfig } from 'vite'

import pkg from './package.json'

export default defineConfig({
  optimizeDeps: {
    exclude: ['wa-sqlite', 'sqlocal'],
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    lib: {
      formats: ['es'],
      entry: './src/index.ts',
      name: 'index',
      fileName: 'index'
    },
    minify: false,
    sourcemap: true,
    outDir: 'build',
    rollupOptions: {
      external: [
        ...Object
          .keys(pkg.dependencies)
      ]
    }
  }
})
