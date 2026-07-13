import { detectBackgroundBounds, detectPaintingBounds } from '../src/lib/segment'

const width = 900
const height = 1200

function fill(
  buf: Uint8ClampedArray,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: [number, number, number],
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4
      buf[i] = color[0]
      buf[i + 1] = color[1]
      buf[i + 2] = color[2]
      buf[i + 3] = 255
    }
  }
}

const pixels = new Uint8ClampedArray(width * height * 4)
fill(pixels, 0, 0, width, height, [238, 220, 193])
fill(pixels, 120, 300, 780, 760, [98, 53, 31])
fill(pixels, 140, 320, 760, 740, [151, 88, 48])
fill(pixels, 158, 338, 742, 722, [242, 235, 220])
fill(pixels, 176, 356, 724, 704, [72, 145, 80])

for (let y = 356; y < 704; y++) {
  for (let x = 176; x < 724; x++) {
    const i = (y * width + x) * 4
    pixels[i] = 50 + ((x * 7 + y * 3) % 170)
    pixels[i + 1] = 80 + ((x * 3 + y * 5) % 150)
    pixels[i + 2] = 40 + ((x * 5 + y * 7) % 180)
  }
}

const outer = detectBackgroundBounds(pixels, width, height)
const painting = detectPaintingBounds(pixels, width, height, outer)
const expected = { top: 356, bottom: 704, left: 176, right: 724 }
const tolerance = 12

console.log(JSON.stringify({ outer, painting, expected }, null, 2))

for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
  if (Math.abs(painting[key] - expected[key]) > tolerance) {
    throw new Error(`${key}: expected ${expected[key]}, got ${painting[key]}`)
  }
}

if (outer.bottom > 820) {
  throw new Error(`outer bottom should exclude wall below frame, got ${outer.bottom}`)
}

const topPixels = new Uint8ClampedArray(width * height * 4)
fill(topPixels, 0, 0, width, height, [238, 220, 193])
fill(topPixels, 140, 90, 760, 430, [98, 53, 31])
fill(topPixels, 160, 110, 740, 410, [242, 235, 220])
fill(topPixels, 180, 130, 720, 390, [72, 145, 80])
for (let y = 130; y < 390; y++) {
  for (let x = 180; x < 720; x++) {
    const i = (y * width + x) * 4
    topPixels[i] = 50 + ((x * 7 + y * 3) % 170)
    topPixels[i + 1] = 80 + ((x * 3 + y * 5) % 150)
    topPixels[i + 2] = 40 + ((x * 5 + y * 7) % 180)
  }
}

const topOuter = detectBackgroundBounds(topPixels, width, height)
if (topOuter.bottom > 520) {
  throw new Error(`top frame crop failed: bottom=${topOuter.bottom}`)
}

console.log('segment smoke ok')
