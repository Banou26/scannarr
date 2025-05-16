import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    include: [
      'prisma-client-generated',
    ],
    exclude: [
      'wa-sqlite',
    ]
  }
})
