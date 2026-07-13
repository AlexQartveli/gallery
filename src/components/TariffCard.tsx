import { formatPrice } from '../data/tariffs'
import type { Tariff } from '../types'
import './TariffCard.css'

interface TariffCardProps {
  tariff: Tariff
  selected?: boolean
  onSelect?: () => void
}

export default function TariffCard({ tariff, selected, onSelect }: TariffCardProps) {
  return (
    <div className={`tariff-card card ${selected ? 'tariff-card--selected' : ''} ${tariff.popular ? 'tariff-card--popular' : ''}`}>
      {tariff.popular && <span className="tariff-card__badge">Популярный</span>}
      <h3 className="tariff-card__name">{tariff.name}</h3>
      <p className="tariff-card__price">{formatPrice(tariff.price)}</p>
      <p className="tariff-card__period">на {tariff.periodDays} дней · до {tariff.maxListings >= 999 ? '∞' : tariff.maxListings} лотов</p>
      <ul className="tariff-card__features">
        {tariff.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {onSelect && (
        <button className={`btn ${selected ? 'btn-primary' : 'btn-secondary'} tariff-card__btn`} onClick={onSelect}>
          {selected ? 'Выбрано' : 'Выбрать'}
        </button>
      )}
    </div>
  )
}
