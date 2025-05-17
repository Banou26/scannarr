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
    },
  },
  plugins: [
    polyfills()
  ],
  optimizeDeps: {
    include: [
      'prisma-client-generated',
      'prisma-client-generated/generated/client',
      'prisma-client-generated/generated/default',
      'prisma-client-generated/generated/index',
      'prisma-client-generated/generated/index-browser',
      'prisma-client-generated/generated/edge',
      'prisma-client-generated/generated/runtime/edge'
    ],
    exclude: [
      'wa-sqlite',
    ],
  },
  define: {
    // 'import.meta.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
    // 'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
    // 'DATABASE_URL': JSON.stringify(process.env.DATABASE_URL)
  },
  resolve: {
    alias: {
      'node:fs/promises': 'fs/promises'
    }
  }
})
