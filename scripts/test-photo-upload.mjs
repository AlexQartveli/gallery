#!/usr/bin/env node
/**
 * Автотест загрузчика фото — вызывает API и печатает отчёт JSON.
 * Использование: node scripts/test-photo-upload.mjs [api-url] [image-path]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const API_URL = process.argv[2] || 'http://geogallery.online/api/process-photo.php'
const IMAGE_PATH = process.argv[3] || '/tmp/test-art.jpg'

async function ensureTestImage() {
  if (existsSync(IMAGE_PATH)) return
  execSync(`curl -sL "https://picsum.photos/1600/900" -o "${IMAGE_PATH}"`, { stdio: 'inherit' })
}

async function main() {
  await ensureTestImage()
  const buf = readFileSync(IMAGE_PATH)
  const base64 = buf.toString('base64')

  const start = Date.now()
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, category: 'painting' }),
  })
  const durationMs = Date.now() - start
  const text = await res.text()

  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, status: res.status, body: text.slice(0, 500) }, null, 2))
    process.exit(1)
  }

  const data = JSON.parse(text)
  if (data.error) {
    console.error(JSON.stringify({ ok: false, error: data.error }, null, 2))
    process.exit(1)
  }

  const report = {
    ok: true,
    timestamp: new Date().toISOString(),
    api: API_URL,
    original: { bytes: buf.length, path: IMAGE_PATH },
    result: {
      width: data.width,
      height: data.height,
      sizeKb: data.sizeKb,
      mime: data.mime,
      tips: data.tips,
    },
    processing: { source: 'server', durationMs, httpStatus: res.status },
    checks: {
      webp: data.mime === 'image/webp',
      framed: data.width >= 400 && data.height >= 400,
      hasImage: typeof data.image === 'string' && data.image.startsWith('data:image/'),
      smallerThanOriginal: data.sizeKb < buf.length / 1024,
    },
  }

  console.log(JSON.stringify(report, null, 2))

  if (data.image?.includes('base64,')) {
    const b64 = data.image.split('base64,')[1]
    const ext = data.mime === 'image/webp' ? 'webp' : 'jpg'
    const out = `/tmp/geo-gallery-test-result.${ext}`
    writeFileSync(out, Buffer.from(b64, 'base64'))
    console.error(`\nSaved: ${out} (${data.width}×${data.height})`)
  }

  const failed = Object.entries(report.checks).filter(([, v]) => !v)
  if (failed.length) {
    console.error('Failed:', failed.map(([k]) => k).join(', '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message }, null, 2))
  process.exit(1)
})
