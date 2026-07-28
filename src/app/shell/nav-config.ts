import { LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  /** i18n key in `namespace:key` form, e.g. 'shell:nav.dashboard' — the colon
   * form resolves regardless of the active default namespace. */
  labelKey: string
  path: string
  icon: LucideIcon
  /** Match this route as active only on an exact path match (index routes). */
  end?: boolean
}

/**
 * The sidebar's single source of truth. Sidebar.tsx renders purely from this
 * array — adding a future section (Partners, Admin, Accounting/GL, ...) is an
 * edit here, never a change to Sidebar itself. Do NOT add an entry before its
 * page actually exists.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'shell:nav.dashboard',
    path: '/app',
    icon: LayoutDashboard,
    end: true,
  },
]
