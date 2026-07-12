import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatPrice } from '../data/paintings'
import './Checkout.css'

export default function Checkout() {
  const { id } = useParams<{ id: string }>()
  const painting = useStore((s) => s.getPainting(id ?? ''))
  const purchasePainting = useStore((s) => s.purchasePainting)
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')
  const [orderId, setOrderId] = useState('')

  if (!painting || painting.status !== 'available') {
    return (
      <div className="checkout checkout--empty container">
        <p>Картина недоступна для покупки</p>
        <Link to="/board" className="btn btn-secondary">← К объявлениям</Link>
      </div>
    )
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep('processing')
    await new Promise((r) => setTimeout(r, 2000))
    const order = purchasePainting(painting.id, form)
    if (order) {
      setOrderId(order.id)
      setStep('success')
    }
  }

  if (step === 'success') {
    return (
      <div className="checkout">
        <div className="container checkout__inner">
          <div className="checkout__success card">
            <div className="checkout__success-icon">✓</div>
            <h1>Оплата прошла успешно!</h1>
            <p>Заказ <strong>{orderId}</strong> оформлен.</p>
            <p className="checkout__success-desc">
              ArtVault выкупит картину «{painting.title}» у художника {painting.artist} и отправит её по адресу:
              <br /><em>{form.address}</em>
            </p>
            <div className="checkout__success-actions">
              <Link to="/board" className="btn btn-primary">К объявлениям</Link>
              <Link to="/gallery" className="btn btn-secondary">В галерею</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout">
      <div className="container checkout__inner">
        <h1 className="checkout__title">Оформление покупки</h1>

        <div className="checkout__grid">
          <form className="checkout__form card" onSubmit={handlePay}>
            <h2>Данные покупателя</h2>

            <div className="form-group">
              <label htmlFor="name">ФИО</label>
              <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label htmlFor="address">Адрес доставки</label>
              <textarea id="address" required rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Город, улица, дом, квартира" />
            </div>

            <button type="submit" className="btn btn-primary checkout__pay" disabled={step === 'processing'}>
              {step === 'processing' ? 'Обработка оплаты...' : `Оплатить ${formatPrice(painting.price)}`}
            </button>

            <p className="checkout__note">
              Демо-режим: реальная оплата не производится
            </p>
          </form>

          <div className="checkout__summary card">
            <img src={painting.imageUrl} alt={painting.title} />
            <h3>{painting.title}</h3>
            <p className="checkout__artist">{painting.artist}</p>
            <p className="checkout__price">{formatPrice(painting.price)}</p>

            <div className="checkout__flow">
              <div className="checkout__flow-step">
                <span>1</span>
                <p>Вы оплачиваете на сайте</p>
              </div>
              <div className="checkout__flow-step">
                <span>2</span>
                <p>ArtVault выкупает у художника</p>
              </div>
              <div className="checkout__flow-step">
                <span>3</span>
                <p>Доставка вам</p>
              </div>
            </div>

            <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
          </div>
        </div>
      </div>
    </div>
  )
}
