import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'
import { expect, test } from 'vitest'

const script = fileURLToPath(new URL('../../scripts/compare-screen-pixels.mjs', import.meta.url))
function chunk(kind: string, data: Buffer) {
  const type = Buffer.from(kind), header = Buffer.alloc(4), checksum = Buffer.alloc(4)
  header.writeUInt32BE(data.length)
  let crc = 0xffffffff
  for (const byte of Buffer.concat([type, data])) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
  return Buffer.concat([header, type, data, checksum])
}
function png(width: number, height: number, filter: number, edited = false) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6
  const pixels = Buffer.alloc(width * height * 4, 120)
  if (edited) pixels[0]++
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = filter
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x, left = x >= 4 ? pixels[at - 4] : 0, up = y ? pixels[at - stride] : 0, diagonal = y && x >= 4 ? pixels[at - stride - 4] : 0
      const p = left + up - diagonal, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - diagonal)
      const predictors = [0, left, up, Math.floor((left + up) / 2), pa <= pb && pa <= pc ? left : pb <= pc ? up : diagonal]
      raw[y * (stride + 1) + 1 + x] = (pixels[at] - predictors[filter]) & 255
    }
  }
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

test.each([0, 1, 2, 3, 4])('exact PNG comparison decodes filter %s and catches one changed pixel', (filter) => {
  const root = mkdtempSync(path.join(tmpdir(), 'or056-pixels-'))
  try {
    const before = path.join(root, 'before'), after = path.join(root, 'after'), report = path.join(root, 'report.json')
    mkdirSync(before); mkdirSync(after)
    writeFileSync(path.join(before, 'home.png'), png(2, 2, 0))
    writeFileSync(path.join(after, 'home.png'), png(2, 2, filter))
    expect(spawnSync(process.execPath, [script, before, after, report, '--require-marketing']).status).toBe(0)
    expect(JSON.parse(readFileSync(report, 'utf8')).changed).toBe(0)
    writeFileSync(path.join(after, 'home.png'), png(2, 2, filter, true))
    expect(spawnSync(process.execPath, [script, before, after, report, '--require-marketing']).status).not.toBe(0)
    expect(JSON.parse(readFileSync(report, 'utf8')).screens[0]).toMatchObject({ changedPixels: 1, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } })
  } finally { rmSync(root, { recursive: true, force: true }) }
})
