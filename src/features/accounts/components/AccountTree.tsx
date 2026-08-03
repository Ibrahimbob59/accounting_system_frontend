import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { AccountBadges } from '@/features/accounts/components/AccountBadges'
import {
  localizedAccountName,
  type AccountTreeNode,
} from '@/features/accounts/types/accounts.types'

interface AccountTreeProps {
  nodes: AccountTreeNode[]
}

/**
 * The chart of accounts as a hierarchy.
 *
 * This is the view that makes a 759-account chart legible: the official Plan
 * Comptable Libanais is meaningful as a structure, and a flat alphabetical
 * list of it isn't navigable. The flat/filterable list is the other tab.
 *
 * Top-level classes start expanded and everything below starts collapsed —
 * opening the whole tree on load would defeat the point.
 */
export function AccountTree({ nodes }: AccountTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(nodes.map((n) => n.id))
  )

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      role="tree"
      className="overflow-hidden rounded-lg border border-border bg-surface"
    >
      {nodes.map((node) => (
        <AccountRow
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
        />
      ))}
    </div>
  )
}

function AccountRow({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: AccountTreeNode
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const { t, i18n } = useTranslation('accounts')
  const navigate = useNavigate()
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.id)

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-level={depth + 1}
        className="flex items-center gap-2 border-b border-row-border last:border-b-0 hover:bg-table-head"
        // Indent is inline because it's a computed per-depth value; a Tailwind
        // class can't express arbitrary depth. Logical padding so it mirrors
        // under RTL.
        style={{ paddingInlineStart: `${depth * 20 + 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={
              isOpen
                ? t('tree.collapse', { name: node.name })
                : t('tree.expand', { name: node.name })
            }
            className="flex size-6 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary"
          >
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4 rtl:rotate-180" />
            )}
          </button>
        ) : (
          // Keeps leaf rows aligned with their expandable siblings.
          <span className="size-6 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => navigate(`/app/accounts/${node.id}`)}
          className="flex flex-1 items-center gap-3 py-2.5 pe-3 text-start"
        >
          <span className="w-20 shrink-0 font-mono text-[13px] text-text-muted">
            {node.number}
          </span>
          <span
            className={cn(
              'flex-1 text-sm text-text-primary',
              // Parents carry the structure, so they read heavier than leaves.
              hasChildren ? 'font-semibold' : 'font-normal',
              !node.isActive && 'text-text-muted'
            )}
          >
            {localizedAccountName(node, i18n.language)}
          </span>
          <AccountBadges account={node} />
        </button>
      </div>

      {hasChildren &&
        isOpen &&
        node.children.map((child) => (
          <AccountRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}
