import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
  test: {
    environment: 'node',
    env: {
      SESSION_SECRET:
        process.env.SESSION_SECRET ?? 'test-session-secret-that-is-32-chars-min',
    },
  },
})
