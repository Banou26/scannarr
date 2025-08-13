import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    livestoreDevtoolsPlugin({
      schemaPath: './src/livestore/schema.ts',
      mode: { _tag: 'web' },
      path: '/test'
    })
  ]
})
