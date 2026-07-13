import './Logo.css'

interface LogoProps {
  variant?: 'full' | 'icon'
  className?: string
}

export default function Logo({ variant = 'full', className }: LogoProps) {
  const src = variant === 'icon' ? '/logo-icon.svg' : '/logo.svg'
  const alt = 'Geo Gallery — geogallery.online'

  return (
    <img
      src={src}
      alt={alt}
      className={`logo-img ${variant === 'icon' ? 'logo-img--icon' : 'logo-img--full'} ${className ?? ''}`}
      width={variant === 'icon' ? 36 : 168}
      height={variant === 'icon' ? 36 : 36}
      decoding="async"
    />
  )
}
