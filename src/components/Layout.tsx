import { Link, Outlet, useLocation } from 'react-router-dom'
import './Layout.css'

const NAV = [
  { to: '/', label: 'Главная' },
  { to: '/board', label: 'Объявления' },
  { to: '/gallery', label: '3D Галерея' },
  { to: '/sell', label: 'Продать' },
]

export default function Layout() {
  const location = useLocation()
  const isGallery = location.pathname === '/gallery'

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
                className={`nav__link ${location.pathname === item.to ? 'nav__link--active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      {!isGallery && (
        <footer className="footer">
          <div className="container footer__inner">
            <p>© 2026 Geo Gallery — маркетплейс картин с онлайн-галереей</p>
            <p className="footer__note">Мы выкупаем картины у художников и доставляем покупателям</p>
          </div>
        </footer>
      )}
    </div>
  )
}
