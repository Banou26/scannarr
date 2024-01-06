import { defineConfig } from 'vite'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

import polyfills from './vite-plugin-node-stdlib-browser.cjs'

import pkg from './package.json'

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      formats: ['es'],
      entry: './src/index.ts',
      name: 'index',
      fileName: 'index'
    },
    minify: true,
    sourcemap: true,
    outDir: 'build',
    rollupOptions: {
      // plugins: [
      //   rollupNodePolyFill()
      // ],
      external: [
        ...Object
          .keys(pkg.dependencies)
      ]
    }
  },
  // plugins: [
  //   // @ts-expect-error
  //   polyfills()
  // ]
})
