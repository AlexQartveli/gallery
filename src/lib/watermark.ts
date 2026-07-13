export const WATERMARK_TEXT = 'geogallery.online'

export function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(11, Math.round(Math.min(width, height) * 0.038))
  const stepX = fontSize * 9.5
  const stepY = fontSize * 3.2

  ctx.save()
  ctx.globalAlpha = 0.24
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'middle'

  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 5.5)
  ctx.translate(-width / 2, -height / 2)

  for (let y = -stepY; y < height + stepY; y += stepY) {
    const row = Math.round(y / stepY)
    const offset = row % 2 === 0 ? 0 : stepX * 0.5
    for (let x = -stepX + offset; x < width + stepX; x += stepX) {
      ctx.fillText(WATERMARK_TEXT, x, y)
    }
  }

  ctx.restore()
}

export async function imageWithWatermark(source: CanvasImageSource, width: number, height: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0, width, height)
  drawWatermark(ctx, width, height)
  return canvas
}
