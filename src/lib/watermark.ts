export const WATERMARK_TEXT = 'geogallery.online'

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity = 0.24,
) {
  const fontSize = Math.max(11, Math.round(Math.min(width, height) * 0.038))
  const stepX = fontSize * 9.5
  const stepY = fontSize * 3.2

  ctx.save()
  ctx.globalAlpha = opacity
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

export function drawWatermarkCorner(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const label = WATERMARK_TEXT
  const fontSize = Math.max(10, Math.round(Math.min(width, height) * 0.022))
  const paddingX = Math.max(8, width * 0.012)
  const paddingY = Math.max(6, height * 0.012)

  ctx.save()
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`
  const textW = ctx.measureText(label).width
  const boxW = textW + paddingX * 2
  const boxH = fontSize + paddingY * 2
  const x = width - boxW - paddingX
  const y = height - boxH - paddingY

  ctx.fillStyle = 'rgba(15, 14, 13, 0.42)'
  ctx.fillRect(x, y, boxW, boxH)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + paddingX, y + boxH / 2)
  ctx.restore()
}

export function drawArtworkWatermark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.translate(x, y)
  drawWatermark(ctx, width, height, 0.34)
  ctx.restore()

  ctx.save()
  ctx.translate(x, y)
  drawWatermarkCorner(ctx, width, height)
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
