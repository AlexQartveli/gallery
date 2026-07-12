import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTariff, formatPrice, TARIFFS } from '../data/tariffs'
import TariffCard from '../components/TariffCard'
import './PlacementCheckout.css'

export default function PlacementCheckout() {
  const [params] = useSearchParams()
  const tariffId = params.get('tariff') ?? 'artist'
  const [selected, setSelected] = useState(tariffId)
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')
  const [orderId, setOrderId] = useState('')

  const currentUser = useStore((s) => s.currentUser)
  const artist = useStore((s) => s.getArtist(currentUser?.artistId ?? ''))
  const payPlacement = useStore((s) => s.payPlacement)
  const navigate = useNavigate()

  const tariff = getTariff(selected)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !tariff) return
    setStep('processing')
    await new Promise((r) => setTimeout(r, 2000))
    const order = payPlacement(selected, currentUser.artistId)
    if (order) {
      setOrderId(order.id)
      setStep('success')
    }
  }

  if (step === 'success' && tariff) {
    return (
      <div className="place-checkout">
        <div className="container place-checkout__inner">
          <div className="place-checkout__success card">
            <div className="place-checkout__icon">✓</div>
            <h1>Оплата прошла!</h1>
            <p>Заказ <strong>{orderId}</strong> · Тариф «{tariff.name}»</p>
            <p className="place-checkout__desc">
              Теперь вы можете разместить до {tariff.maxListings >= 999 ? 'безлимитно' : tariff.maxListings} лотов
              на {tariff.periodDays} дней.
            </p>
            <div className="place-checkout__actions">
              <Link to="/sell" className="btn btn-primary">Разместить работу</Link>
              <Link to="/board" className="btn btn-secondary">К каталогу</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="place-checkout">
      <div className="container place-checkout__inner">
        <h1>Оплата размещения</h1>
        {artist && <p className="place-checkout__artist">Автор: {artist.name}</p>}

        <div className="place-checkout__grid">
          <form className="place-checkout__form card" onSubmit={handlePay}>
            <h2>Выберите тариф</h2>
            <div className="place-checkout__tariffs">
              {TARIFFS.map((t) => (
                <TariffCard key={t.id} tariff={t} selected={selected === t.id} onSelect={() => setSelected(t.id)} />
              ))}
            </div>

            <div className="form-group">
              <label>Email для чека</label>
              <input type="email" required placeholder="email@example.com" />
            </div>

            <button type="submit" className="btn btn-primary place-checkout__pay" disabled={step === 'processing'}>
              {step === 'processing' ? 'Обработка...' : `Оплатить ${tariff ? formatPrice(tariff.price) : ''}`}
            </button>
            <p className="place-checkout__note">Демо-режим: реальная оплата не производится</p>
          </form>

          {tariff && (
            <div className="place-checkout__summary card">
              <h3>{tariff.name}</h3>
              <p className="place-checkout__price">{formatPrice(tariff.price)}</p>
              <p>{tariff.periodDays} дней · {tariff.maxListings >= 999 ? '∞' : tariff.maxListings} лотов</p>
              <ul>
                {tariff.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
