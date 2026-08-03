import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/app/shell/Sidebar'
import { TopBar } from '@/app/shell/TopBar'
import { useLocalStorageState } from '@/app/shell/useLocalStorageState'

/**
 * The `/app` shell (§1): a sidebar + top bar framing the routed page `<Outlet>`.
 * Sidebar-collapsed state is local here and persisted to localStorage — per
 * CONVENTIONS.md it's parent/child state, not cross-cutting, so it doesn't earn
 * a Zustand store. The mobile drawer's open state is ephemeral (plain useState).
 */
export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorageState(
    'sidebar-collapsed',
    false
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onOpenMobileSidebar={() => setMobileOpen(true)} />
        {/* The only scrollable region (handoff §4) — sidebar and top bar are
            fixed height. `p-page` is the density token, so switching to
            compact re-pads every page at once. */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
