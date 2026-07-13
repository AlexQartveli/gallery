export type GalleryRoomId = 'classic_realism' | 'white_cube' | 'industrial_loft' | 'digital_nft'

export type FrameStyle = 'ornate' | 'minimal' | 'industrial' | 'holographic' | 'hanging'

export interface RoomThemeSpec {
  id: GalleryRoomId
  label: string
  subtitle: string
  wall: string
  wallAccent: string
  floor: string
  ceiling: string
  accent: string
  light: string
  trim: string
  plaque: string
  fogNear: number
  fogFar: number
  floorRoughness: number
  floorMetalness: number
  ambientIntensity: number
  hemisphereIntensity: number
  directionalIntensity: number
  frameStyle: FrameStyle
  spotColor: string
  spotIntensity: number
  neonAccent?: string
}
