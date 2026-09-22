import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

const alias = {
  '@': path.resolve(root, './src'),
}

const env = {
  SESSION_SECRET:
    process.env.SESSION_SECRET ?? 'test-session-secret-that-is-32-chars-min',
}

const shared = {
  resolve: { alias },
  environment: 'node' as const,
  env,
}

export const unitProject = {
  resolve: { alias },
  test: {
    name: 'unit',
    environment: shared.environment,
    env,
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    fileParallelism: true,
    sequence: { groupOrder: 0 },
  },
}

export const integrationProject = {
  resolve: { alias },
  test: {
    name: 'integration',
    environment: shared.environment,
    env,
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['src/db/integration-setup.ts'],
    fileParallelism: false,
    isolate: false,
    maxWorkers: 1,
    minWorkers: 1,
    pool: 'forks' as const,
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 120_000,
    hookTimeout: 60_000,
    sequence: { concurrent: false, groupOrder: 1 },
  },
}

export default defineConfig({
  resolve: { alias },
  test: {
    environment: 'node',
    env,
    projects: [unitProject, integrationProject],
  },
})
