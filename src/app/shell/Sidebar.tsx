import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/app/shell/nav-config'
import { useAuthStore } from '@/features/auth/store/auth-store'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

interface PanelProps {
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

function initials(first?: string, last?: string): string {
  return `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.toUpperCase() || '?'
}

/**
 * The sidebar's inner content — shared by the desktop rail and mobile drawer.
 * Order is fixed by handoff §4: logo → nav → collapse toggle → profile row.
 */
function SidebarPanel({ collapsed, onToggleCollapse, onNavigate }: PanelProps) {
  const { t } = useTranslation(['shell', 'common'])
  const user = useAuthStore((s) => s.user)
  const appName = t('appName', { ns: 'common' })
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : ''

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-text">
      {/* Brand lockup. The mark stays visible when collapsed — it's the only
          thing anchoring the rail once labels are gone. Its height matches the
          top bar's so the two line up across the seam. */}
      <div
        className={cn(
          'flex h-topbar shrink-0 items-center gap-2.5',
          collapsed ? 'justify-center px-4' : 'px-6'
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand font-display text-[15px] font-bold text-white">
          {appName.charAt(0)}
        </span>
        {!collapsed && (
          <span className="truncate font-display text-[19px] font-bold tracking-[-0.01em]">
            {appName}
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? t(item.labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-sidebar-muted hover:bg-white/[0.06]'
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" />
            <span className={cn(collapsed && 'sr-only')}>
              {t(item.labelKey)}
            </span>
          </NavLink>
        ))}
      </nav>

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          aria-expanded={!collapsed}
          className={cn(
            'flex items-center gap-3 border-t border-sidebar-border py-2.5 text-[13px] font-medium text-sidebar-muted transition-colors hover:bg-white/[0.06]',
            collapsed ? 'justify-center px-4' : 'px-6'
          )}
        >
          {/* Chevrons point the way the rail will move, and flip under RTL so
              they keep meaning "outward" rather than a fixed left/right. */}
          {collapsed ? (
            <ChevronRight className="size-[18px] shrink-0 rtl:rotate-180" />
          ) : (
            <ChevronLeft className="size-[18px] shrink-0 rtl:rotate-180" />
          )}
          {!collapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
      )}

      <div
        className={cn(
          'flex items-center gap-2.5 border-t border-sidebar-border p-4',
          collapsed && 'justify-center'
        )}
      >
        <span className="flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-sm bg-brand text-[13px] font-bold text-white">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            initials(user?.firstName, user?.lastName)
          )}
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-sidebar-text">
              {name}
            </div>
            {/* The prototype's second line is a hardcoded role ("Admin"); the
                API's CurrentUser carries no role, so this shows the email —
                the real identifying detail we actually have. */}
            {user?.email && (
              <div className="truncate text-xs text-sidebar-muted">
                {user.email}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * App-chrome navigation rail (handoff §4). Renders purely from NAV_ITEMS.
 *
 * The rail is dark in BOTH light and dark mode — a deliberate fixed-chrome
 * treatment (handoff §1), which is why it reads the `--sidebar*` tokens rather
 * than the theme-swapping neutral aliases every other surface uses.
 *
 * On desktop it toggles between labeled (260/220px) and a 76px icon-only rail;
 * below `lg` it becomes an overlay drawer rather than a squeezed column — the
 * handoff has no mobile layout, and a squeezed rail would be inventing one.
 */
export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { t } = useTranslation('shell')
  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'hidden shrink-0 transition-[width] duration-150 ease-out lg:block',
          collapsed ? 'lg:w-sidebar-collapsed' : 'lg:w-sidebar'
        )}
      >
        <SidebarPanel
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('sidebar.closeMenu')}
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/50"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 start-0 w-sidebar shadow-lg">
            <SidebarPanel collapsed={false} onNavigate={onCloseMobile} />
          </div>
        </div>
      )}
    </>
  )
}
