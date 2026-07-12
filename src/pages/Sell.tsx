import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/categories'
import { getTariff, formatPrice } from '../data/tariffs'
import { BOOST_PRODUCTS } from '../data/boosts'
import { processPhoto, PHOTO_PROCESS_PRICE } from '../lib/photoProcessor'
import type { CategoryId, ProcessedPhoto, VipBoostType } from '../types'
import './Sell.css'

export default function Sell() {
  const addArtwork = useStore((s) => s.addArtwork)
  const payBoost = useStore((s) => s.payBoost)
  const currentUser = useStore((s) => s.currentUser)
  const artist = useStore((s) => s.getArtist(currentUser?.artistId ?? ''))
  const canAdd = useStore((s) => s.canAddListing(currentUser?.artistId ?? ''))
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const rawFileRef = useRef<File | null>(null)

  const [form, setForm] = useState({
    title: '',
    category: 'painting' as CategoryId,
    description: '',
    price: '',
    width: '',
    height: '',
    depth: '',
    imageUrl: '',
    seoAlt: '',
  })
  const [rawPreview, setRawPreview] = useState('')
  const [preview, setPreview] = useState('')
  const [processing, setProcessing] = useState(false)
  const [photoPaid, setPhotoPaid] = useState(false)
  const [processed, setProcessed] = useState<ProcessedPhoto | null>(null)
  const [selectedVip, setSelectedVip] = useState<VipBoostType | 'pack' | null>(null)
  const [payingPhoto, setPayingPhoto] = useState(false)

  const tariff = getTariff(currentUser?.tariffId ?? artist?.tariffId ?? '')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      alert('Максимум 15 МБ')
      return
    }
    rawFileRef.current = file
    const dataUrl = URL.createObjectURL(file)
    setRawPreview(dataUrl)
    setPreview('')
    setProcessed(null)
    setPhotoPaid(false)
  }

  const handlePhotoProcess = async () => {
    const file = rawFileRef.current
    if (!file || !currentUser) return

    setPayingPhoto(true)
    await new Promise((r) => setTimeout(r, 1500))
    payBoost('ai_photo', currentUser.artistId)
    setPhotoPaid(true)
    setPayingPhoto(false)

    setProcessing(true)
    try {
      const result = await processPhoto(file, form.category)
      setProcessed(result)
      setPreview(result.image)
      setForm((f) => ({
        ...f,
        imageUrl: result.image,
        title: result.seoTitle || f.title,
        description: result.seoDescription || f.description,
        seoAlt: result.seoAlt,
        category: (result.suggestedCategory as CategoryId) || f.category,
      }))
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !canAdd.ok) return

    if (!photoPaid || !processed) {
      alert(`Сначала оплатите обработку фото (${PHOTO_PROCESS_PRICE} ₾)`)
      return
    }

    let vipBoosts = undefined
    if (selectedVip) {
      payBoost(selectedVip, currentUser.artistId)
      const boost = BOOST_PRODUCTS.find((b) => b.id === selectedVip)
      if (boost && boost.periodDays > 0) {
        const exp = new Date(Date.now() + boost.periodDays * 86400000).toISOString()
        if (selectedVip === 'pack') {
          vipBoosts = { crown: exp, spotlight: exp, catalog: exp }
        } else if (selectedVip === 'crown') {
          vipBoosts = { crown: exp }
        } else if (selectedVip === 'spotlight') {
          vipBoosts = { spotlight: exp }
        } else if (selectedVip === 'catalog') {
          vipBoosts = { catalog: exp }
        }
      }
    }

    const artwork = addArtwork({
      title: form.title,
      artistId: currentUser.artistId,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      width: Number(form.width),
      height: Number(form.height),
      depth: form.depth ? Number(form.depth) : undefined,
      imageUrl: form.imageUrl,
      imageOptimized: true,
      seoAlt: form.seoAlt,
      vipBoosts,
      aiScore: processed.score,
      aiTips: processed.tips,
    })

    if (artwork) navigate(`/artwork/${artwork.id}`)
    else alert(canAdd.reason ?? 'Не удалось разместить')
  }

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const vipProducts = BOOST_PRODUCTS.filter((b) => b.id !== 'ai_photo')

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
          <p>Тариф: <strong>{tariff?.name}</strong></p>
        </header>

        <form className="sell__form card" onSubmit={handleSubmit}>
          <div className="sell__upload">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
            <div className="sell__preview-row">
              {rawPreview && (
                <div className="sell__preview-box">
                  <span className="sell__preview-label">Оригинал</span>
                  <img src={rawPreview} alt="Оригинал" />
                </div>
              )}
              <div className="sell__preview" onClick={() => !preview && fileRef.current?.click()}>
                {preview ? (
                  <>
                    <span className="sell__preview-label">Обработанное · {processed?.width}×{processed?.height}</span>
                    <img src={preview} alt={form.seoAlt || 'Обработанное'} />
                  </>
                ) : (
                  <div className="sell__upload-placeholder">
                    <span>📷</span>
                    <p>Загрузите фото работы</p>
                    <small>JPEG, PNG, WebP до 15 МБ</small>
                  </div>
                )}
              </div>
            </div>

            {rawPreview && !photoPaid && (
              <button
                type="button"
                className="btn btn-primary sell__ai-btn"
                onClick={handlePhotoProcess}
                disabled={payingPhoto || processing}
              >
                {payingPhoto ? 'Оплата...' : processing ? 'Обработка...' : `📷 Обработка фото — ${formatPrice(PHOTO_PROCESS_PRICE)}`}
              </button>
            )}

            {photoPaid && <p className="sell__ai-paid">✓ Обработка фото оплачена</p>}

            {processed && (
              <div className="sell__analysis card">
                <div className="sell__analysis-score">
                  Оценка: <strong>{processed.score}/10</strong>
                  · {processed.width}×{processed.height} · {processed.sizeKb} КБ
                </div>
                <p className="sell__seo-alt">{processed.tips[0]}</p>
                {processed.tips.map((t) => <p key={t} className="sell__tip">💡 {t}</p>)}
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
              <input required value={form.title} onChange={(e) => update('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Описание (SEO)</label>
              <textarea required rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
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
                <label>Глубина (см)</label>
                <input type="number" min={0} value={form.depth} onChange={(e) => update('depth', e.target.value)} />
              </div>
            </div>

            <div className="sell__vip">
              <h3>VIP-размещение (опционально)</h3>
              <div className="sell__vip-grid">
                {vipProducts.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`sell__vip-item ${selectedVip === b.id ? 'sell__vip-item--active' : ''}`}
                    onClick={() => setSelectedVip(selectedVip === b.id ? null : b.id as VipBoostType | 'pack')}
                  >
                    <span className="sell__vip-icon">{b.icon}</span>
                    <span className="sell__vip-name">{b.name}</span>
                    <span className="sell__vip-price">{formatPrice(b.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary sell__submit" disabled={!photoPaid}>
              Опубликовать лот
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
