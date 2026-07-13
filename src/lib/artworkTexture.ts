import { useEffect, useState } from 'react'
import * as THREE from 'three'

const textureCache = new Map<string, Promise<THREE.Texture>>()

function placeholderColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 32% 42%)`
}

async function loadArtworkTexture(url: string): Promise<THREE.Texture> {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) {
    throw new Error(`Texture fetch failed: ${response.status}`)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Texture decode failed'))
      img.src = objectUrl
    })

    const texture = new THREE.Texture(image)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getCachedTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url)
  if (cached) return cached

  const pending = loadArtworkTexture(url).catch((error) => {
    textureCache.delete(url)
    throw error
  })
  textureCache.set(url, pending)
  return pending
}

export function useArtworkTexture(url: string, artworkId: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [failed, setFailed] = useState(false)
  const fallbackColor = placeholderColor(artworkId)

  useEffect(() => {
    let active = true
    setFailed(false)
    setTexture(null)

    getCachedTexture(url)
      .then((loaded) => {
        if (!active) return
        setTexture(loaded)
      })
      .catch(() => {
        if (!active) return
        setFailed(true)
        setTexture(null)
      })

    return () => {
      active = false
    }
  }, [url])

  return { texture, failed, fallbackColor }
}
