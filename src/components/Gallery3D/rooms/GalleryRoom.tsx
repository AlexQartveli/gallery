import type { RoomThemeSpec } from './types'
import ClassicRealismRoom from './ClassicRealismRoom'
import WhiteCubeRoom from './WhiteCubeRoom'
import IndustrialLoftRoom from './IndustrialLoftRoom'
import DigitalNftRoom from './DigitalNftRoom'

export default function GalleryRoom({ spec }: { spec: RoomThemeSpec }) {
  switch (spec.id) {
    case 'white_cube':
      return <WhiteCubeRoom spec={spec} />
    case 'industrial_loft':
      return <IndustrialLoftRoom spec={spec} />
    case 'digital_nft':
      return <DigitalNftRoom spec={spec} />
    case 'classic_realism':
    default:
      return <ClassicRealismRoom spec={spec} />
  }
}
