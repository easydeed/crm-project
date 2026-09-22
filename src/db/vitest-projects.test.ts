import { expect, test } from 'vitest'
import { integrationProject, unitProject } from '../../vitest.config'

test('unit tests stay parallel and integration tests run serially', () => {
  expect(unitProject.test?.name).toBe('unit')
  expect(unitProject.test?.fileParallelism).toBe(true)
  expect(unitProject.test?.sequence?.groupOrder).toBe(0)
  expect(unitProject.test?.exclude).toEqual(
    expect.arrayContaining(['src/**/*.integration.test.ts']),
  )
  expect(integrationProject.test?.name).toBe('integration')
  expect(integrationProject.test?.fileParallelism).toBe(false)
  expect(integrationProject.test?.setupFiles).toEqual(['src/db/integration-setup.ts'])
  expect(integrationProject.test?.maxWorkers).toBe(1)
  expect(integrationProject.test?.poolOptions?.forks?.singleFork).toBe(true)
  expect(integrationProject.test?.include).toEqual(['src/**/*.integration.test.ts'])
  expect(integrationProject.test?.sequence?.concurrent).toBe(false)
  expect(integrationProject.test?.sequence?.groupOrder).toBe(1)
})
