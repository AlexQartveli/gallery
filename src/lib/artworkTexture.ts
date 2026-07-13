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
  drawWatermark(canvas.getContext('2d')!, canvas.width, canvas.height)

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

async function loadArtworkTexture(url: string): Promise<THREE.Texture> {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) {
    throw new Error(`Texture fetch failed: ${response.status}`)
  }

  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)

  try {
    const width = bitmap.width
    const height = bitmap.height
    if (!width || !height) {
      throw new Error('Texture decode failed: empty image')
    }

    const texture = new THREE.Texture(bitmap)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  } finally {
    // ImageBitmap is copied into the GPU texture; release memory.
    bitmap.close()
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
