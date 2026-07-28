import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/app/shell/nav-config'

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

/** The sidebar's inner content — shared by the desktop rail and mobile drawer. */
function SidebarPanel({ collapsed, onToggleCollapse, onNavigate }: PanelProps) {
  const { t } = useTranslation(['shell', 'common'])
  const appName = t('appName', { ns: 'common' })

  return (
    <div className="flex h-full flex-col bg-sidebar text-text-on-primary">
      {/* Wordmark — same brand asset slot as AuthLayout. */}
      <div className="flex h-16 items-center px-4 font-display text-xl font-bold">
        {collapsed ? appName.charAt(0) : appName}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? t(item.labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-text-on-primary/80 hover:bg-text-on-primary/10 hover:text-text-on-primary'
              )
            }
          >
            <item.icon className="size-5 shrink-0" />
            <span className={cn(collapsed && 'sr-only')}>
              {t(item.labelKey)}
            </span>
          </NavLink>
        ))}
      </nav>

      {onToggleCollapse && (
        <div className="border-t border-text-on-primary/10 p-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-on-primary/80 transition-colors hover:bg-text-on-primary/10 hover:text-text-on-primary',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0 rtl:rotate-180" />
            ) : (
              <PanelLeftClose className="size-5 shrink-0 rtl:rotate-180" />
            )}
            <span className={cn(collapsed && 'sr-only')}>
              {t('sidebar.collapse')}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * App-chrome navigation rail. Renders purely from NAV_ITEMS (§2). On desktop
 * it's a static rail that toggles between icon-only and labeled; below `lg` it
 * becomes an overlay drawer instead of a squeezed column (§3).
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
          'hidden shrink-0 transition-[width] duration-200 lg:block',
          collapsed ? 'lg:w-16' : 'lg:w-64'
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
          <div className="absolute inset-y-0 start-0 w-64 shadow-lg">
            <SidebarPanel collapsed={false} onNavigate={onCloseMobile} />
          </div>
        </div>
      )}
    </>
  )
}
