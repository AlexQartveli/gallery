import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatPrice } from '../data/paintings'
import './PaintingCard.css'

interface PaintingCardProps {
  id: string
  compact?: boolean
}

export default function PaintingCard({ id, compact }: PaintingCardProps) {
  const painting = useStore((s) => s.getPainting(id))

  if (!painting) return null

  return (
    <Link to={`/painting/${painting.id}`} className={`painting-card card ${compact ? 'painting-card--compact' : ''}`}>
      <div className="painting-card__image-wrap">
        <img src={painting.imageUrl} alt={painting.title} loading="lazy" />
        <span className={`badge ${painting.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
          {painting.status === 'available' ? 'В продаже' : 'Продано'}
        </span>
      </div>
      <div className="painting-card__body">
        <h3 className="painting-card__title">{painting.title}</h3>
        <p className="painting-card__artist">{painting.artist}</p>
        {!compact && <p className="painting-card__desc">{painting.description}</p>}
        <p className="painting-card__price">{formatPrice(painting.price)}</p>
      </div>
    </Link>
  )
}
