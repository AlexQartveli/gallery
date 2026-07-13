import { detectBackgroundBounds, detectPaintingBounds } from '../src/lib/segment'

const width = 900
const height = 1200
const pixels = new Uint8ClampedArray(width * height * 4)

function fill(x0: number, y0: number, x1: number, y1: number, color: [number, number, number]) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4
      pixels[i] = color[0]
      pixels[i + 1] = color[1]
      pixels[i + 2] = color[2]
      pixels[i + 3] = 255
    }
  }
}

fill(0, 0, width, height, [238, 220, 193])
fill(120, 300, 780, 760, [98, 53, 31])
fill(140, 320, 760, 740, [151, 88, 48])
fill(158, 338, 742, 722, [242, 235, 220])
fill(176, 356, 724, 704, [72, 145, 80])

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
