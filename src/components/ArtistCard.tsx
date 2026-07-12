import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTariff } from '../data/tariffs'
import type { Artist } from '../types'
import './ArtistCard.css'

interface ArtistCardProps {
  artist: Artist
  showWorks?: boolean
}

export default function ArtistCard({ artist, showWorks = true }: ArtistCardProps) {
  const works = useStore((s) => s.getArtistWorks(artist.id))
  const tariff = getTariff(artist.tariffId)
  const preview = works.filter((w) => w.status === 'active').slice(0, 4)

  return (
    <div className="artist-card card">
      <Link to={`/artist/${artist.id}`} className="artist-card__header">
        <img src={artist.avatar} alt={artist.name} className="artist-card__avatar" />
        <div>
          <h3 className="artist-card__name">{artist.name}</h3>
          <p className="artist-card__city">{artist.city}</p>
          {tariff && <span className="artist-card__tariff">{tariff.name}</span>}
        </div>
      </Link>
      <p className="artist-card__bio">{artist.bio}</p>
      {showWorks && preview.length > 0 && (
        <div className="artist-card__works">
          {preview.map((w) => (
            <Link key={w.id} to={`/artwork/${w.id}`} className="artist-card__work-thumb">
              <img src={w.imageUrl} alt={w.title} loading="lazy" />
            </Link>
          ))}
        </div>
      )}
      <div className="artist-card__footer">
        <span>{works.filter((w) => w.status === 'active').length} работ в продаже</span>
        <Link to={`/artist/${artist.id}`} className="btn btn-ghost artist-card__link">Профиль →</Link>
      </div>
    </div>
  )
}
