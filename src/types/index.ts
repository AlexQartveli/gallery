export type CategoryId =
  | 'painting'
  | 'sculpture'
  | 'photography'
  | 'graphics'
  | 'digital'
  | 'ceramics'
  | 'textile'

export type ArtworkStatus = 'active' | 'sold' | 'draft' | 'expired'

export interface VipBoosts {
  crown?: string
  spotlight?: string
  catalog?: string
}

export type VipBoostType = 'crown' | 'spotlight' | 'catalog' | 'pack'

export interface BoostProduct {
  id: 'ai_photo' | VipBoostType
  name: string
  description: string
  price: number
  periodDays: number
  icon: string
  features: string[]
  popular?: boolean
}

export interface Artist {
  id: string
  name: string
  bio: string
  city: string
  avatar: string
  website?: string
  tariffId: string
  joinedAt: string
  featured: boolean
}

export interface Artwork {
  id: string
  title: string
  artistId: string
  category: CategoryId
  description: string
  price: number
  width: number
  height: number
  depth?: number
  imageUrl: string
  status: ArtworkStatus
  createdAt: string
  expiresAt: string
  featured: boolean
  imageOptimized?: boolean
  seoAlt?: string
  vipBoosts?: VipBoosts
  aiScore?: number
  aiTips?: string[]
}

export interface Category {
  id: CategoryId
  name: string
  icon: string
  description: string
  galleryTheme: string
  examples: string[]
}

export interface Tariff {
  id: string
  name: string
  price: number
  periodDays: number
  maxListings: number
  features: string[]
  aiAnalysis: boolean
  featured: boolean
  popular?: boolean
}

export interface PlacementOrder {
  id: string
  tariffId: string
  artistId: string
  amount: number
  status: 'paid' | 'pending'
  createdAt: string
  expiresAt: string
}

export interface PurchaseOrder {
  id: string
  artworkId: string
  buyerName: string
  buyerEmail: string
  buyerAddress: string
  amount: number
  status: 'paid' | 'shipped' | 'delivered'
  createdAt: string
}

export interface PhotoAnalysis {
  score: number
  ready: boolean
  issues: string[]
  tips: string[]
  suggestedTitle?: string
  suggestedDescription?: string
  detectedCategory?: string
}

export interface ProcessedPhoto {
  image: string
  mime: string
  width: number
  height: number
  sizeKb: number
  score: number
  ready: boolean
  issues: string[]
  tips: string[]
  seoTitle: string
  seoDescription: string
  seoAlt: string
  suggestedCategory?: string
}

export interface BoostOrder {
  id: string
  artworkId?: string
  boostId: string
  artistId: string
  amount: number
  status: 'paid' | 'pending'
  createdAt: string
  expiresAt: string
}

export interface NewArtwork {
  title: string
  artistId: string
  category: CategoryId
  description: string
  price: number
  width: number
  height: number
  depth?: number
  imageUrl: string
  imageOptimized?: boolean
  seoAlt?: string
  vipBoosts?: VipBoosts
  aiScore?: number
  aiTips?: string[]
}
