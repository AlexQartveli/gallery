import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import './Sell.css'

export default function Sell() {
  const addListing = useStore((s) => s.addListing)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    artist: '',
    description: '',
    price: '',
    width: '',
    height: '',
    imageUrl: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const painting = {
      title: form.title,
      artist: form.artist,
      description: form.description,
      price: Number(form.price),
      width: Number(form.width),
      height: Number(form.height),
      imageUrl: form.imageUrl || `https://picsum.photos/seed/${Date.now()}/600/800`,
    }
    addListing(painting)
    navigate('/board')
  }

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="sell">
      <div className="container sell__inner">
        <header className="sell__header">
          <h1 className="sell__title">Разместить картину</h1>
          <p className="sell__subtitle">
            После продажи Geo Gallery выкупит вашу работу и доставит покупателю
          </p>
        </header>

        <form className="sell__form card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Название картины</label>
            <input id="title" required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Утренний туман" />
          </div>

          <div className="form-group">
            <label htmlFor="artist">Имя художника</label>
            <input id="artist" required value={form.artist} onChange={(e) => update('artist', e.target.value)} placeholder="Ваше имя" />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea id="description" required rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Техника, материалы, история работы..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена (₽)</label>
              <input id="price" type="number" required min={1000} value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="25000" />
            </div>
            <div className="form-group">
              <label htmlFor="width">Ширина (см)</label>
              <input id="width" type="number" required min={10} value={form.width} onChange={(e) => update('width', e.target.value)} placeholder="60" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="height">Высота (см)</label>
              <input id="height" type="number" required min={10} value={form.height} onChange={(e) => update('height', e.target.value)} placeholder="80" />
            </div>
            <div className="form-group">
              <label htmlFor="imageUrl">URL изображения (необязательно)</label>
              <input id="imageUrl" type="url" value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <button type="submit" className="btn btn-primary sell__submit">Опубликовать объявление</button>
        </form>
      </div>
    </div>
  )
}
