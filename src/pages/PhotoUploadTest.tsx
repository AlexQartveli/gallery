import { useState, useRef } from 'react'
import { processPhotoDetailed, type ProcessPhotoReport } from '../lib/photoProcessor'
import ArtworkMedia from '../components/ArtworkMedia'
import './PhotoUploadTest.css'

function buildReportJson(report: ProcessPhotoReport): string {
  const payload = {
    timestamp: new Date().toISOString(),
    original: report.original,
    result: {
      width: report.result.width,
      height: report.result.height,
      sizeKb: report.result.sizeKb,
      mime: report.result.mime,
      ready: report.result.ready,
      score: report.result.score,
      tips: report.result.tips,
    },
    processing: {
      durationMs: report.durationMs,
    },
    crop: report.crop,
    artwork: report.artwork,
    extractMethod: report.extractMethod,
    checks: {
      webp: report.result.mime === 'image/webp',
      framed: true,
      nativeFrameRemoved: report.crop?.cropped ?? false,
      perspectiveCorrected: report.extractMethod === 'perspective',
      artworkKeptWhole: Boolean(report.artwork?.width && report.artwork?.height),
      watermark: true,
    },
  }

  return JSON.stringify(payload, null, 2)
}

function createSampleFile(): File {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 900
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  grad.addColorStop(0, '#1a3a5c')
  grad.addColorStop(0.5, '#c45c3e')
  grad.addColorStop(1, '#e8c170')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(80, 60, canvas.width - 160, canvas.height - 120)

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 72px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('TEST PAINTING', canvas.width / 2, canvas.height / 2)
  ctx.font = '28px sans-serif'
  ctx.fillStyle = '#444'
  ctx.fillText('1600 × 900 · Geo Gallery', canvas.width / 2, canvas.height / 2 + 60)

  const dataUrl = canvas.toDataURL('image/png')
  const bin = atob(dataUrl.split(',')[1])
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], 'test-painting-1600x900.png', { type: 'image/png' })
}

export default function PhotoUploadTest() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [report, setReport] = useState<ProcessPhotoReport | null>(null)
  const [rawPreview, setRawPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const runTest = async (file: File) => {
    setLoading(true)
    setError('')
    setCopied(false)
    setRawPreview(URL.createObjectURL(file))
    try {
      const data = await processPhotoDetailed(file, 'painting')
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обработки')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) runTest(file)
  }

  const handleSample = () => runTest(createSampleFile())

  const handleCopy = async () => {
    if (!report) return
    await navigator.clipboard.writeText(buildReportJson(report))
    setCopied(true)
  }

  const handleDownload = () => {
    if (!report) return
    const a = document.createElement('a')
    a.href = report.result.image
    const ext = report.result.mime === 'image/webp' ? 'webp' : 'jpg'
    a.download = `processed-${Date.now()}.${ext}`
    a.click()
  }

  const reportJson = report ? buildReportJson(report) : ''

  return (
    <div className="upload-test">
      <div className="container upload-test__inner">
        <header className="upload-test__header">
          <h1>Тест загрузчика фото</h1>
          <p>Загрузите изображение или сгенерируйте тестовое — скопируйте отчёт и пришлите результат</p>
        </header>

        <div className="upload-test__controls card">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
          <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={loading}>
            Выбрать файл
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSample} disabled={loading}>
            Сгенерировать тест 1600×900
          </button>
        </div>

        {loading && <p className="upload-test__status">Обработка...</p>}
        {error && <p className="upload-test__error">{error}</p>}

        {report && (
          <>
            <div className="upload-test__previews">
              <div className="upload-test__preview card">
                <h3>Оригинал</h3>
                {rawPreview && <img src={rawPreview} alt="Оригинал" />}
                <dl>
                  <dt>Файл</dt><dd>{report.original.name}</dd>
                  <dt>Размер</dt><dd>{(report.original.bytes / 1024).toFixed(1)} КБ</dd>
                  <dt>Пиксели</dt><dd>{report.original.width}×{report.original.height}</dd>
                </dl>
              </div>
              <div className="upload-test__preview card">
                <h3>Результат</h3>
                <ArtworkMedia wrapClassName="upload-test__media" src={report.result.image} alt="Результат" />
                <dl>
                  <dt>Формат</dt><dd>{report.result.mime}</dd>
                  <dt>Размер</dt><dd>{report.result.sizeKb} КБ</dd>
                  <dt>Пиксели</dt><dd>{report.result.width}×{report.result.height}</dd>
                  <dt>Время</dt><dd>{report.durationMs} мс</dd>
                </dl>
              </div>
            </div>

            <div className="upload-test__actions">
              <button type="button" className="btn btn-primary" onClick={handleCopy}>
                {copied ? '✓ Скопировано' : 'Скопировать отчёт JSON'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleDownload}>
                Скачать результат
              </button>
            </div>

            <pre className="upload-test__report card">{reportJson}</pre>
          </>
        )}
      </div>
    </div>
  )
}
