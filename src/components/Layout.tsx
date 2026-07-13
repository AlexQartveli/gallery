import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTariff } from '../data/tariffs'
import Logo from './Logo'
import './Layout.css'

const NAV = [
  { to: '/', label: 'Главная', icon: '⌂' },
  { to: '/board', label: 'Каталог', icon: '▦' },
  { to: '/galleries', label: '3D Галереи', icon: '◇' },
  { to: '/artists', label: 'Авторы', icon: '◉' },
  { to: '/pricing', label: 'Тарифы', icon: '₾' },
  { to: '/sell', label: 'Разместить', icon: '+' },
]

export default function Layout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isGallery = location.pathname.startsWith('/gallery/')
  const currentUser = useStore((s) => s.currentUser)
  const artist = useStore((s) => s.getArtist(currentUser?.artistId ?? ''))
  const tariff = getTariff(currentUser?.tariffId ?? '')

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <div className={`layout ${isGallery ? 'layout--gallery' : ''}`}>
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="logo" aria-label="Geo Gallery — на главную">
            <Logo />
          </Link>
          <nav className="nav">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav__link ${isActive(item.to) ? 'nav__link--active' : ''}`}
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
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu-panel"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      {menuOpen && (
      <div className="mobile-menu mobile-menu--open" aria-hidden={false}>
        <button
          type="button"
          className="mobile-menu__backdrop"
          aria-label="Закрыть меню"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          id="mobile-menu-panel"
          className="mobile-menu__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Навигация"
        >
          <div className="mobile-menu__head">
            <Link to="/" className="mobile-menu__brand" aria-label="Geo Gallery — на главную">
              <Logo />
            </Link>
            <button
              type="button"
              className="mobile-menu__close"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
            >
              <span />
              <span />
            </button>
          </div>

          <p className="mobile-menu__eyebrow">Навигация</p>
          <nav className="mobile-menu__nav">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`mobile-menu__link ${isActive(item.to) ? 'mobile-menu__link--active' : ''}`}
              >
                <span className="mobile-menu__icon">{item.icon}</span>
                <span>{item.label}</span>
                <span className="mobile-menu__arrow">→</span>
              </Link>
            ))}
          </nav>

          {artist && (
            <Link to={`/artist/${artist.id}`} className="mobile-menu__profile">
              <img src={artist.avatar} alt="" />
              <span>
                <strong>{artist.name}</strong>
                <small>{tariff ? `Тариф «${tariff.name}»` : 'Профиль автора'}</small>
              </span>
              <span className="mobile-menu__arrow">→</span>
            </Link>
          )}

          <div className="mobile-menu__footer">
            <span>Искусство рядом с вами</span>
            <Logo variant="icon" />
          </div>
        </aside>
      </div>
      )}
      <main className="main">
        <Outlet />
      </main>
      {!isGallery && (
        <footer className="footer">
          <div className="container footer__inner">
            <Link to="/" className="footer__logo" aria-label="Geo Gallery — на главную">
              <Logo />
            </Link>
            <p>© 2026 Geo Gallery — маркетплейс искусства с онлайн-галереями</p>
            <p className="footer__note">Размещение платное · Geo Gallery выкупает работы и доставляет покупателям</p>
            <a href="https://geogallery.online" className="footer__domain">geogallery.online</a>
          </div>
        </footer>
      )}
    </div>
  )
}
