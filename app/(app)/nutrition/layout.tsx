import { NutritionSubnav } from './nutrition-subnav'

export default function NutritionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <NutritionSubnav />
      {children}
    </div>
  )
}
