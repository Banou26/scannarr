import { defineConfig } from 'vite'
import typescript2 from "rollup-plugin-typescript2"
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

import polyfills from './vite-plugin-node-stdlib-browser.cjs'

export default defineConfig({
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
      plugins: [
        rollupNodePolyFill()
      ]
    }
  },
  plugins: [
    {
      ...typescript2({
        abortOnError: false
      }),
      apply: 'build'
    },
    // @ts-expect-error
    polyfills()
  ]
})
