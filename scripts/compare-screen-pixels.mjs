// Exact decoded PNG pixels, no tolerance, masks, resizing, or anti-alias exclusions.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import path from 'node:path'

function png(file) {
  const bytes = readFileSync(file)
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not PNG: ${file}`)
  let width, height, channels
  const chunks = []
  for (let pos = 8; pos < bytes.length;) {
    const size = bytes.readUInt32BE(pos), type = bytes.toString('ascii', pos + 4, pos + 8)
    const data = bytes.subarray(pos + 8, pos + 8 + size)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0
      if (data[8] !== 8 || !channels || data[12] !== 0) throw new Error(`Unsupported PNG format: ${file}`)
    }
    if (type === 'IDAT') chunks.push(data)
    pos += size + 12
  }
  const input = inflateSync(Buffer.concat(chunks)), stride = width * channels
  const pixels = Buffer.alloc(stride * height)
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const filter = input[y * (stride + 1)]
    if (filter > 4) throw new Error(`Bad PNG filter: ${filter}`)
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x, left = x >= channels ? pixels[at - channels] : 0
      const up = y ? pixels[at - stride] : 0, diagonal = y && x >= channels ? pixels[at - stride - channels] : 0
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, diagonal)][filter]
      pixels[at] = (input[y * (stride + 1) + 1 + x] + predictor) & 255
    }
  }
  return { width, height, channels, pixels }
}

function compare(a, b) {
  let changedPixels = 0, minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
  for (let y = 0; y < Math.max(a.height, b.height); y++) for (let x = 0; x < Math.max(a.width, b.width); x++) {
    const outsideA = x >= a.width || y >= a.height, outsideB = x >= b.width || y >= b.height
    if (outsideA && outsideB) continue
    let changed = outsideA || outsideB
    if (!changed) for (let c = 0; c < 4; c++) {
      const av = c >= a.channels ? 255 : a.pixels[(y * a.width + x) * a.channels + c]
      const bv = c >= b.channels ? 255 : b.pixels[(y * b.width + x) * b.channels + c]
      if (av !== bv) { changed = true; break }
    }
    if (changed) { changedPixels++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
  }
  return { changedPixels, bounds: changedPixels ? { minX, minY, maxX, maxY } : null, before: [a.width, a.height], after: [b.width, b.height] }
}

const [before, after, destination, requireMarketing] = process.argv.slice(2)
if (!before || !after || !destination) throw new Error('Usage: compare-screen-pixels before after report.json [--require-marketing]')
const names = (dir) => readdirSync(dir).filter((name) => name.endsWith('.png')).sort()
const files = names(before)
if (!files.length || JSON.stringify(files) !== JSON.stringify(names(after))) throw new Error('Screen sets differ or are empty')
const screens = files.map((file) => ({ name: file.slice(0, -4), ...compare(png(path.join(before, file)), png(path.join(after, file))) }))
const changed = screens.filter((screen) => screen.changedPixels)
writeFileSync(destination, JSON.stringify({ total: screens.length, changed: changed.length, screens }, null, 2))
console.log(`${changed.length}/${screens.length} screens changed; exact pixel report: ${destination}`)
for (const screen of changed) console.log(`${screen.name}: ${screen.changedPixels} pixels; ${screen.before.join('x')} -> ${screen.after.join('x')}`)
if (requireMarketing === '--require-marketing' && changed.some((screen) => ['home', 'home-dark', 'sample', 'sample-text-dark'].includes(screen.name))) throw new Error('Marketing pixels changed')
