import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { scenarios } from '../src/digest/fixtures/scenarios'
import {
  previewFileBody,
  previewIndexHtml,
  scenarioFileName,
  type PreviewIndexRow,
} from '../src/digest/preview-pages'
import { renderDigest } from '../src/digest/render'

const outDir = path.join(process.cwd(), 'preview', 'digest')
mkdirSync(outDir, { recursive: true })

const rows: PreviewIndexRow[] = scenarios.map((scenario) => {
  const result = renderDigest(scenario.input)
  const file = scenarioFileName(scenario.name)
  writeFileSync(path.join(outDir, file), previewFileBody(result), 'utf8')
  return {
    name: scenario.name,
    file,
    send: result.send,
    blocks: result.send ? result.blocks : [],
    reason: result.send ? undefined : result.reason,
  }
})

writeFileSync(path.join(outDir, 'index.html'), previewIndexHtml(rows), 'utf8')
console.log(`Wrote ${rows.length + 1} files to ${outDir}`)
