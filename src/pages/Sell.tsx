import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/categories'
import { getTariff } from '../data/tariffs'
import { analyzePhoto, fileToBase64, fileToDataUrl } from '../lib/gemini'
import type { CategoryId, PhotoAnalysis } from '../types'
import './Sell.css'

export default function Sell() {
  const addArtwork = useStore((s) => s.addArtwork)
  const currentUser = useStore((s) => s.currentUser)
  const artist = useStore((s) => s.getArtist(currentUser?.artistId ?? ''))
  const canAdd = useStore((s) => s.canAddListing(currentUser?.artistId ?? ''))
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    category: 'painting' as CategoryId,
    description: '',
    price: '',
    width: '',
    height: '',
    depth: '',
    imageUrl: '',
  })
  const [preview, setPreview] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null)

  const tariff = getTariff(currentUser?.tariffId ?? artist?.tariffId ?? '')
  const hasAi = tariff?.aiAnalysis ?? false

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Максимальный размер файла: 10 МБ')
      return
    }

    const dataUrl = await fileToDataUrl(file)
    setPreview(dataUrl)
    setForm((f) => ({ ...f, imageUrl: dataUrl }))

    if (hasAi) {
      setAnalyzing(true)
      try {
        const base64 = await fileToBase64(file)
        const result = await analyzePhoto(base64, form.category)
        setAnalysis(result)
        if (result.suggestedTitle && !form.title) {
          setForm((f) => ({
            ...f,
            title: result.suggestedTitle ?? f.title,
            description: result.suggestedDescription ?? f.description,
            category: (result.detectedCategory as CategoryId) || f.category,
          }))
        }
      } finally {
        setAnalyzing(false)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !canAdd.ok) return

    const artwork = addArtwork({
      title: form.title,
      artistId: currentUser.artistId,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      width: Number(form.width),
      height: Number(form.height),
      depth: form.depth ? Number(form.depth) : undefined,
      imageUrl: form.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/1000`,
      aiScore: analysis?.score,
      aiTips: analysis?.tips,
    })

    if (artwork) navigate(`/artwork/${artwork.id}`)
    else alert(canAdd.reason ?? 'Не удалось разместить')
  }

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  if (!canAdd.ok) {
    return (
      <div className="sell">
        <div className="container sell__inner">
          <div className="sell__blocked card">
            <h2>Размещение недоступно</h2>
            <p>{canAdd.reason}</p>
            <Link to="/pricing" className="btn btn-primary">Выбрать тариф</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sell">
      <div className="container sell__inner">
        <header className="sell__header">
          <h1>Разместить работу</h1>
          <p>Тариф: <strong>{tariff?.name}</strong> · {hasAi ? 'AI-анализ Gemini включён' : 'Без AI-анализа'}</p>
        </header>

        <form className="sell__form card" onSubmit={handleSubmit}>
          <div className="sell__upload">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
            <div className="sell__preview" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="Превью" />
              ) : (
                <div className="sell__upload-placeholder">
                  <span>📷</span>
                  <p>Нажмите для загрузки фото</p>
                  <small>JPEG, PNG до 10 МБ</small>
                </div>
              )}
            </div>

            {analyzing && <p className="sell__analyzing">Gemini анализирует фото...</p>}

            {analysis && (
              <div className="sell__analysis card">
                <div className="sell__analysis-score">
                  Оценка: <strong>{analysis.score}/10</strong>
                  {analysis.ready ? ' ✓ Готово' : ' — нужны правки'}
                </div>
                {analysis.issues.length > 0 && (
                  <ul className="sell__analysis-issues">
                    {analysis.issues.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                )}
                {analysis.tips.length > 0 && (
                  <ul className="sell__analysis-tips">
                    {analysis.tips.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="sell__fields">
            <div className="form-group">
              <label>Категория</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} required>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Название</label>
              <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Название работы" />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea required rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Техника, материалы..." />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Цена (₾)</label>
                <input type="number" required min={20} value={form.price} onChange={(e) => update('price', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ширина (см)</label>
                <input type="number" required min={5} value={form.width} onChange={(e) => update('width', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Высота (см)</label>
                <input type="number" required min={5} value={form.height} onChange={(e) => update('height', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Глубина (см, для скульптур)</label>
                <input type="number" min={0} value={form.depth} onChange={(e) => update('depth', e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary sell__submit">Опубликовать лот</button>
          </div>
        </form>
      </div>
    </div>
  )
}
