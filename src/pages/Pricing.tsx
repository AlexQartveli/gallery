import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TARIFFS } from '../data/tariffs'
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
            <li>AI-анализ фото через Gemini (тарифы Художник и выше)</li>
            <li>Geo Gallery выкупает проданные работы и доставляет покупателям</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
