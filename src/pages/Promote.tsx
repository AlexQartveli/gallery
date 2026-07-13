import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { BOOST_PRODUCTS } from '../data/boosts'
import { formatPrice } from '../data/tariffs'
import { isBoostActive } from '../data/boosts'
import ArtworkMedia from '../components/ArtworkMedia'
import './Promote.css'

export default function Promote() {
  const { id } = useParams<{ id: string }>()
  const artwork = useStore((s) => s.getArtwork(id ?? ''))
  const currentUser = useStore((s) => s.currentUser)
  const payBoost = useStore((s) => s.payBoost)
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(false)

  if (!artwork) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>Лот не найден</p>
        <Link to="/board">← К каталогу</Link>
      </div>
    )
  }

  const vipProducts = BOOST_PRODUCTS.filter((b) => b.id !== 'ai_photo')

  const handlePay = async () => {
    if (!selected || !currentUser) return
    setPaying(true)
    await new Promise((r) => setTimeout(r, 1500))
    payBoost(selected, currentUser.artistId, artwork.id)
    setPaying(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="promote">
        <div className="container promote__inner">
          <div className="promote__success card">
            <h1>VIP активирован!</h1>
            <p>Опция применена к «{artwork.title}»</p>
            <Link to={`/artwork/${artwork.id}`} className="btn btn-primary">К лоту</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="promote">
      <div className="container promote__inner">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
        <h1>VIP для «{artwork.title}»</h1>

        <div className="promote__current card">
          <ArtworkMedia wrapClassName="promote__media" src={artwork.imageUrl} alt={artwork.title} />
          <div>
            <p>Текущие VIP:</p>
            <ul>
              <li>{isBoostActive(artwork.vipBoosts?.crown) ? '👑 Корона активна' : '👑 Корона — нет'}</li>
              <li>{isBoostActive(artwork.vipBoosts?.spotlight) ? '💡 Прожектор активен' : '💡 Прожектор — нет'}</li>
              <li>{isBoostActive(artwork.vipBoosts?.catalog) ? '⭐ Топ каталога' : '⭐ Топ каталога — нет'}</li>
            </ul>
          </div>
        </div>

        <div className="promote__grid">
          {vipProducts.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`promote__item card ${selected === b.id ? 'promote__item--active' : ''}`}
              onClick={() => setSelected(b.id)}
            >
              <span className="promote__icon">{b.icon}</span>
              <h3>{b.name}</h3>
              <p>{b.description}</p>
              <p className="promote__price">{formatPrice(b.price)}</p>
              <ul>{b.features.map((f) => <li key={f}>{f}</li>)}</ul>
            </button>
          ))}
        </div>

        <button className="btn btn-primary promote__pay" disabled={!selected || paying} onClick={handlePay}>
          {paying ? 'Оплата...' : selected ? `Оплатить ${formatPrice(vipProducts.find((b) => b.id === selected)?.price ?? 0)}` : 'Выберите опцию'}
        </button>
        <p className="promote__note">Демо-режим</p>
      </div>
    </div>
  )
}
