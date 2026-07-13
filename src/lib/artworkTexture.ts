import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { drawWatermark } from './watermark'

const textureCache = new Map<string, Promise<THREE.Texture>>()
let watermarkOverlay: THREE.CanvasTexture | null = null

function placeholderColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 32% 42%)`
}

export function getWatermarkOverlayTexture(): THREE.CanvasTexture {
  if (watermarkOverlay) return watermarkOverlay

  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 160
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawWatermark(ctx, canvas.width, canvas.height)

  watermarkOverlay = new THREE.CanvasTexture(canvas)
  watermarkOverlay.colorSpace = THREE.SRGBColorSpace
  watermarkOverlay.wrapS = THREE.RepeatWrapping
  watermarkOverlay.wrapT = THREE.RepeatWrapping
  watermarkOverlay.repeat.set(1.6, 2.4)
  watermarkOverlay.minFilter = THREE.LinearFilter
  watermarkOverlay.magFilter = THREE.LinearFilter
  watermarkOverlay.generateMipmaps = false
  watermarkOverlay.needsUpdate = true
  return watermarkOverlay
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Texture decode failed: empty image'))
        return
      }
      resolve(image)
    }
    image.onerror = () => reject(new Error('Texture decode failed'))
    image.src = url
  })
}

async function loadArtworkTexture(url: string): Promise<THREE.Texture> {
  let objectUrl: string | null = null

  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) {
      throw new Error(`Texture fetch failed: ${response.status}`)
    }

    const blob = await response.blob()
    objectUrl = URL.createObjectURL(blob)
    const image = await loadImageElement(objectUrl)

    const texture = new THREE.Texture(image)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  } catch (fetchError) {
    // Fallback for hosts that block fetch/CORS but still allow <img>.
    try {
      const image = await loadImageElement(url)
      const texture = new THREE.Texture(image)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.needsUpdate = true
      return texture
    } catch {
      throw fetchError
    }
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
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
