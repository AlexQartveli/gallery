import type { CategoryId } from '../../../types'
import type { GalleryRoomId, RoomThemeSpec } from './types'

export const ROOM_SPECS: Record<GalleryRoomId, RoomThemeSpec> = {
  classic_realism: {
    id: 'classic_realism',
    label: 'Классика и реализм',
    subtitle: 'Неоклассический музейный коридор',
    wall: '#3a1f28',
    wallAccent: '#2a1520',
    floor: '#5c3d2e',
    ceiling: '#1a1410',
    accent: '#c9a962',
    light: '#ffddb0',
    trim: '#b89452',
    plaque: '#2a1f18',
    fogNear: 14,
    fogFar: 42,
    floorRoughness: 0.28,
    floorMetalness: 0.12,
    ambientIntensity: 0.32,
    hemisphereIntensity: 0.22,
    directionalIntensity: 0.28,
    frameStyle: 'ornate',
    spotColor: '#ffe4b8',
    spotIntensity: 6.5,
  },
  white_cube: {
    id: 'white_cube',
    label: 'Модерн и импрессионизм',
    subtitle: 'Белый куб с дневным светом',
    wall: '#f6f6f4',
    wallAccent: '#ececea',
    floor: '#e8dcc8',
    ceiling: '#fafafa',
    accent: '#8a8a8a',
    light: '#f5f8ff',
    trim: '#d8d8d6',
    plaque: '#efefed',
    fogNear: 18,
    fogFar: 50,
    floorRoughness: 0.42,
    floorMetalness: 0.04,
    ambientIntensity: 0.55,
    hemisphereIntensity: 0.38,
    directionalIntensity: 0.45,
    frameStyle: 'minimal',
    spotColor: '#ffffff',
    spotIntensity: 4.2,
  },
  industrial_loft: {
    id: 'industrial_loft',
    label: 'Современное искусство и поп-арт',
    subtitle: 'Индустриальный лофт',
    wall: '#6a6a6a',
    wallAccent: '#4a4a4a',
    floor: '#3a3a3a',
    ceiling: '#1e1e1e',
    accent: '#e85d04',
    light: '#f0f0f0',
    trim: '#1a1a1a',
    plaque: '#2c2c2c',
    fogNear: 12,
    fogFar: 38,
    floorRoughness: 0.12,
    floorMetalness: 0.55,
    ambientIntensity: 0.28,
    hemisphereIntensity: 0.18,
    directionalIntensity: 0.2,
    frameStyle: 'hanging',
    spotColor: '#fff5e6',
    spotIntensity: 8,
    neonAccent: '#ff3366',
  },
  digital_nft: {
    id: 'digital_nft',
    label: 'Цифровое искусство и NFT',
    subtitle: 'Киберпанк-галерея',
    wall: '#080810',
    wallAccent: '#050508',
    floor: '#0c0c14',
    ceiling: '#030308',
    accent: '#00d4ff',
    light: '#c8e8ff',
    trim: '#1a1a2e',
    plaque: '#101018',
    fogNear: 10,
    fogFar: 36,
    floorRoughness: 0.05,
    floorMetalness: 0.82,
    ambientIntensity: 0.22,
    hemisphereIntensity: 0.15,
    directionalIntensity: 0.12,
    frameStyle: 'holographic',
    spotColor: '#88ccff',
    spotIntensity: 5.5,
    neonAccent: '#9b5cff',
  },
}

const CATEGORY_ROOM: Record<CategoryId, GalleryRoomId> = {
  painting: 'classic_realism',
  sculpture: 'classic_realism',
  photography: 'white_cube',
  graphics: 'white_cube',
  digital: 'digital_nft',
  ceramics: 'industrial_loft',
  textile: 'industrial_loft',
}

export function getRoomForCategory(categoryId: CategoryId): GalleryRoomId {
  return CATEGORY_ROOM[categoryId] ?? 'classic_realism'
}

export function getRoomSpec(roomId: GalleryRoomId): RoomThemeSpec {
  return ROOM_SPECS[roomId]
}

export function getRoomSpecForCategory(categoryId: CategoryId): RoomThemeSpec {
  return getRoomSpec(getRoomForCategory(categoryId))
}
