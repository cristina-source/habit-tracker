import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { CommandPalette } from '@/components/command-palette'
import { ToastContainer } from '@/components/toast-container'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <MobileNav /> {/* [ITERATE v2] — mobile hamburger */}
      <main
        className="app-main"
        style={{
          flex: 1,
          marginLeft: '200px',
          padding: '32px',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
      <CommandPalette />
      <ToastContainer />
      {/* [ITERATE v2] — responsive layout */}
      <style>{`
        @media (max-width: 768px) {
          .app-main { margin-left: 0 !important; padding: 16px !important; padding-top: 56px !important; }
          aside { display: none !important; }
        }
      `}</style>
    </div>
  )
}
