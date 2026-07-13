import { useStore } from '../store/useStore'
import ArtistCard from '../components/ArtistCard'
import './Artists.css'

export default function Artists() {
  const artists = useStore((s) => s.artists)

  return (
    <div className="artists-page">
      <div className="container">
        <header className="artists-page__header">
          <h1>Авторы</h1>
          <p>{artists.length} художников на платформе</p>
        </header>
        <div className="artists-page__grid">
          {artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
        </div>
      </div>
    </div>
  )
}
