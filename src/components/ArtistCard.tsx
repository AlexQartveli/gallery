import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTariff, formatPrice } from '../data/tariffs'
import ArtworkMedia from './ArtworkMedia'
import type { Artist } from '../types'
import './ArtistCard.css'

interface ArtistCardProps {
  artist: Artist
  showWorks?: boolean
}

export default function ArtistCard({ artist, showWorks = true }: ArtistCardProps) {
  const artworks = useStore((s) => s.artworks)
  const works = artworks.filter((work) => work.artistId === artist.id && work.status !== 'draft')
  const activeWorks = works.filter((work) => work.status === 'active')
  const preview = activeWorks.slice(0, 4)
  const tariff = getTariff(artist.tariffId)

  return (
    <article className="artist-card card">
      <div className="artist-card__head">
        <Link to={`/artist/${artist.id}`} className="artist-card__profile">
          <img src={artist.avatar} alt={artist.name} className="artist-card__avatar" />
          <div>
            <div className="artist-card__name-row">
              <h3 className="artist-card__name">{artist.name}</h3>
              {artist.featured && <span className="artist-card__featured">Избранный</span>}
            </div>
            <p className="artist-card__city">{artist.city}</p>
            {tariff && <span className="artist-card__tariff">Тариф «{tariff.name}»</span>}
          </div>
        </Link>
        <div className="artist-card__stats">
          <strong>{activeWorks.length}</strong>
          <span>в продаже</span>
        </div>
      </div>

      <p className="artist-card__bio">{artist.bio}</p>

      {showWorks && preview.length > 0 && (
        <div className="artist-card__works">
          <div className="artist-card__works-head">
            <span>Работы автора</span>
            <span>{activeWorks.length} лотов</span>
          </div>
          <div className={`artist-card__works-grid artist-card__works-grid--${Math.min(preview.length, 4)}`}>
            {preview.map((work, index) => (
              <Link
                key={work.id}
                to={`/artwork/${work.id}`}
                className={`artist-card__work ${index === 0 ? 'artist-card__work--hero' : ''}`}
              >
                <ArtworkMedia
                  wrapClassName="artist-card__work-media"
                  src={work.imageUrl}
                  alt={work.title}
                  loading="lazy"
                >
                  <div className="artist-card__work-info">
                    <span className="artist-card__work-title">{work.title}</span>
                    <span className="artist-card__work-price">{formatPrice(work.price)}</span>
                  </div>
                </ArtworkMedia>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="artist-card__footer">
        <span>{works.filter((work) => work.status === 'sold').length} продано</span>
        <Link to={`/artist/${artist.id}`} className="btn btn-ghost artist-card__link">
          Профиль автора →
        </Link>
      </div>
    </article>
  )
}
