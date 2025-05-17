import { defineConfig } from 'vite'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

import polyfills from './vite-plugin-node-stdlib-browser.cjs'

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'build',
    rollupOptions: {
      plugins: [
        rollupNodePolyFill()
      ]
    }
  },
  plugins: [
    polyfills()
  ],
  optimizeDeps: {
    include: [
      'prisma-client-generated',
      'prisma-client-generated/generated/client',
      'prisma-client-generated/generated/edge'
    ],
    exclude: [
      'wa-sqlite',
    ]
  }
})
