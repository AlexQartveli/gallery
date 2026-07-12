import { Link, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTariff } from '../data/tariffs'
import './Layout.css'

const NAV = [
  { to: '/', label: 'Главная' },
  { to: '/board', label: 'Каталог' },
  { to: '/galleries', label: '3D Галереи' },
  { to: '/artists', label: 'Авторы' },
  { to: '/pricing', label: 'Тарифы' },
  { to: '/sell', label: 'Разместить' },
]

export default function Layout() {
  const location = useLocation()
  const isGallery = location.pathname.startsWith('/gallery/')
  const currentUser = useStore((s) => s.currentUser)
  const artist = useStore((s) => s.getArtist(currentUser?.artistId ?? ''))
  const tariff = getTariff(currentUser?.tariffId ?? '')

  return (
    <div className={`layout ${isGallery ? 'layout--gallery' : ''}`}>
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="logo">
            <span className="logo__mark">◆</span>
            <span className="logo__text">Geo Gallery</span>
          </Link>
          <nav className="nav">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav__link ${location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)) ? 'nav__link--active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {artist && (
            <Link to={`/artist/${artist.id}`} className="header__profile">
              <img src={artist.avatar} alt="" />
              <span className="header__profile-info">
                <span className="header__profile-name">{artist.name}</span>
                {tariff && <span className="header__profile-tariff">{tariff.name}</span>}
              </span>
            </Link>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      {!isGallery && (
        <footer className="footer">
          <div className="container footer__inner">
            <p>© 2026 Geo Gallery — маркетплейс искусства с онлайн-галереями</p>
            <p className="footer__note">Размещение платное · Geo Gallery выкупает работы и доставляет покупателям</p>
          </div>
        </footer>
      )}
    </div>
  )
}
