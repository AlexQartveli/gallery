import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TARIFFS } from '../data/tariffs'
import { BOOST_PRODUCTS } from '../data/boosts'
import { formatPrice } from '../data/tariffs'
import TariffCard from '../components/TariffCard'
import './Pricing.css'

export default function Pricing() {
  const [selected, setSelected] = useState('artist')
  const navigate = useNavigate()

  const handleContinue = () => {
    navigate(`/place-checkout?tariff=${selected}`)
  }

  return (
    <div className="pricing-page">
      <div className="container">
        <header className="pricing-page__header">
          <h1>Тарифы размещения</h1>
          <p>Оплатите размещение, чтобы ваши работы появились в каталоге и 3D-галереях Geo Gallery</p>
        </header>

        <div className="pricing-page__grid">
          {TARIFFS.map((t) => (
            <TariffCard
              key={t.id}
              tariff={t}
              selected={selected === t.id}
              onSelect={() => setSelected(t.id)}
            />
          ))}
        </div>

        <div className="pricing-page__actions">
          <button className="btn btn-primary" onClick={handleContinue}>Оплатить и разместить</button>
        </div>

        <div className="pricing-page__note card">
          <h3>Что входит в размещение</h3>
          <ul>
            <li>Карточка автора с портфолио</li>
            <li>Публикация в каталоге по категориям</li>
            <li>Экспонирование в тематической 3D-галерее</li>
            <li>Geo Gallery выкупает проданные работы и доставляет покупателям</li>
          </ul>
        </div>

        <section className="pricing-page__boosts">
          <h2>Дополнительные услуги</h2>
          <p className="pricing-page__boosts-desc">AI-обработка и VIP-размещение оплачиваются отдельно</p>
          <div className="pricing-page__boosts-grid">
            {BOOST_PRODUCTS.map((b) => (
              <div key={b.id} className="pricing-page__boost card">
                <span className="pricing-page__boost-icon">{b.icon}</span>
                <h3>{b.name}</h3>
                <p>{b.description}</p>
                <p className="pricing-page__boost-price">{formatPrice(b.price)}</p>
                <ul>{b.features.slice(0, 3).map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
