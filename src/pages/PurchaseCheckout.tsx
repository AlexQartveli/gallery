import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatPrice } from '../data/tariffs'
import './PurchaseCheckout.css'

export default function PurchaseCheckout() {
  const { id } = useParams<{ id: string }>()
  const artwork = useStore((s) => s.getArtwork(id ?? ''))
  const artist = useStore((s) => s.getArtist(artwork?.artistId ?? ''))
  const purchaseArtwork = useStore((s) => s.purchaseArtwork)
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')
  const [orderId, setOrderId] = useState('')

  if (!artwork || artwork.status !== 'active') {
    return (
      <div className="purchase-checkout container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p>Лот недоступен</p>
        <Link to="/board" className="btn btn-secondary">← К каталогу</Link>
      </div>
    )
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep('processing')
    await new Promise((r) => setTimeout(r, 2000))
    const order = purchaseArtwork(artwork.id, form)
    if (order) { setOrderId(order.id); setStep('success') }
  }

  if (step === 'success') {
    return (
      <div className="purchase-checkout">
        <div className="container purchase-checkout__inner">
          <div className="purchase-checkout__success card">
            <div className="purchase-checkout__icon">✓</div>
            <h1>Оплата прошла!</h1>
            <p>Заказ <strong>{orderId}</strong></p>
            <p className="purchase-checkout__desc">
              Geo Gallery выкупит «{artwork.title}» у {artist?.name} и отправит по адресу:<br />
              <em>{form.address}</em>
            </p>
            <Link to="/board" className="btn btn-primary">К каталогу</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-checkout">
      <div className="container purchase-checkout__inner">
        <h1>Покупка работы</h1>
        <div className="purchase-checkout__grid">
          <form className="purchase-checkout__form card" onSubmit={handlePay}>
            <h2>Данные покупателя</h2>
            <div className="form-group">
              <label>ФИО</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Адрес доставки</label>
              <textarea required rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary purchase-checkout__pay" disabled={step === 'processing'}>
              {step === 'processing' ? 'Обработка...' : `Оплатить ${formatPrice(artwork.price)}`}
            </button>
            <p className="purchase-checkout__note">Демо-режим</p>
          </form>
          <div className="purchase-checkout__summary card">
            <img src={artwork.imageUrl} alt={artwork.title} />
            <h3>{artwork.title}</h3>
            {artist && <p>{artist.name}</p>}
            <p className="purchase-checkout__price">{formatPrice(artwork.price)}</p>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
          </div>
        </div>
      </div>
    </div>
  )
}
