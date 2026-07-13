import type { ImgHTMLAttributes, ReactNode } from 'react'
import './ArtworkMedia.css'

interface ArtworkMediaProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapClassName?: string
  children?: ReactNode
}

export default function ArtworkMedia({ wrapClassName, children, className, alt = '', ...imgProps }: ArtworkMediaProps) {
  return (
    <div className={`artwork-media ${wrapClassName ?? ''}`}>
      <img className={className} alt={alt} {...imgProps} />
      <div className="artwork-watermark" aria-hidden="true" />
      {children}
    </div>
  )
}
