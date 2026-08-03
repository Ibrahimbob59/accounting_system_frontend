import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Breadcrumbs } from '@/app/shell/Breadcrumbs'
import { ThemeToggle } from '@/app/shell/ThemeToggle'
import { UserMenu } from '@/app/shell/UserMenu'

/**
 * Top bar: breadcrumbs on the start side; language, theme and account controls
 * on the end. The hamburger opens the mobile sidebar drawer and is hidden once
 * the static rail appears at `lg`.
 */
export function TopBar({
  onOpenMobileSidebar,
}: {
  onOpenMobileSidebar: () => void
}) {
  const { t } = useTranslation('shell')

  return (
    <header className="flex h-topbar shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileSidebar}
          aria-label={t('sidebar.openMenu')}
        >
          <Menu />
        </Button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
