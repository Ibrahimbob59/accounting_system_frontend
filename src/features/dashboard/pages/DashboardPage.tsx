import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Boxes,
  Coins,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { QuickActions } from '@/features/dashboard/components/QuickActions'
import {
  AttentionCard,
  type AttentionItem,
} from '@/features/dashboard/components/AttentionCard'
import {
  RecentCard,
  RecentRow,
} from '@/features/dashboard/components/RecentCard'
import { usePartnersCount } from '@/features/dashboard/hooks/usePartnersCount'
import { useUsersCount } from '@/features/dashboard/hooks/useUsersCount'
import { useAccountsCount } from '@/features/dashboard/hooks/useAccountsCount'
import { useItemsCount } from '@/features/dashboard/hooks/useDashboardCounts'
import { useIncomeStatement } from '@/features/reports/hooks/useStatements'
import { useValuation } from '@/features/stock/hooks/useMovements'
import { useSalesInvoices } from '@/features/invoicing/hooks/useSalesInvoices'
import { useVendorBills } from '@/features/purchasing/hooks/useVendorBills'
import { usePurchaseOrders } from '@/features/purchasing/hooks/usePurchaseOrders'
import { useStockCounts } from '@/features/stock/hooks/useStockCounts'
import { useStockTransfers } from '@/features/stock/hooks/useStockTransfers'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const yearStart = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

export function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard')
  const lang = i18n.language
  const user = useAuthStore((s) => s.user)
  const companies = useAuthStore((s) => s.companies)
  const isPlatformAdmin = companies.length === 0
  const active = !isPlatformAdmin

  const companyBase = useActiveCompanyBaseCurrency()
  const lookupCurrency = useCurrencyLookup()
  const partners = useAllPartners()

  // Financial KPIs (year to date).
  const income = useIncomeStatement(
    { from: yearStart(), to: today(), presentIn: companyBase },
    active
  )
  const valuation = useValuation(undefined)

  // Actionable backlogs.
  const draftSales = useSalesInvoices(
    active ? { status: 'DRAFT', limit: 1 } : undefined
  )
  const draftBills = useVendorBills(
    active ? { status: 'DRAFT', limit: 1 } : undefined
  )
  const draftPOs = usePurchaseOrders(
    active ? { status: 'DRAFT', limit: 1 } : undefined
  )
  const posToReceive = usePurchaseOrders(
    active ? { status: 'CONFIRMED', limit: 1 } : undefined
  )
  const draftCounts = useStockCounts(
    active ? { status: 'DRAFT', limit: 1 } : undefined
  )
  const draftTransfers = useStockTransfers(
    active ? { status: 'DRAFT', limit: 1 } : undefined
  )

  // Recent activity.
  const recentSales = useSalesInvoices(active ? { limit: 5 } : undefined)
  const recentPayments = usePayments(active ? { limit: 5 } : undefined)

  // Master-data counts (secondary strip).
  const partnersCount = usePartnersCount(active)
  const usersCount = useUsersCount(active)
  const accountsCount = useAccountsCount(active)
  const itemsCount = useItemsCount(active)

  if (isPlatformAdmin) {
    return (
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('platformAdmin.title')}
        </h1>
        <p className="mt-2 text-text-secondary">{t('platformAdmin.body')}</p>
      </div>
    )
  }

  const baseCur = companyBase ? lookupCurrency(companyBase) : undefined
  const money = (n: number) => formatMoney(n, baseCur, lang)
  const inc = income.data
  const net = inc?.netResult ?? null

  const attention: AttentionItem[] = [
    {
      key: 'draftSales',
      label: t('attention.draftSales'),
      count: draftSales.data?.meta?.total,
      to: '/app/sales-invoices',
      isLoading: draftSales.isLoading,
    },
    {
      key: 'draftBills',
      label: t('attention.draftBills'),
      count: draftBills.data?.meta?.total,
      to: '/app/vendor-bills',
      isLoading: draftBills.isLoading,
    },
    {
      key: 'draftPOs',
      label: t('attention.draftPOs'),
      count: draftPOs.data?.meta?.total,
      to: '/app/purchase-orders',
      isLoading: draftPOs.isLoading,
    },
    {
      key: 'posToReceive',
      label: t('attention.posToReceive'),
      count: posToReceive.data?.meta?.total,
      to: '/app/purchase-orders',
      isLoading: posToReceive.isLoading,
    },
    {
      key: 'draftCounts',
      label: t('attention.draftCounts'),
      count: draftCounts.data?.meta?.total,
      to: '/app/stock-counts',
      isLoading: draftCounts.isLoading,
    },
    {
      key: 'draftTransfers',
      label: t('attention.draftTransfers'),
      count: draftTransfers.data?.meta?.total,
      to: '/app/stock-transfers',
      isLoading: draftTransfers.isLoading,
    },
  ]

  const partnerName = (id: string) =>
    partners.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {user?.firstName
              ? t('welcome', { name: user.firstName })
              : t('welcomeGeneric')}
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {t('welcomeSubtitle')}
          </p>
        </div>
      </div>

      <QuickActions />

      {/* Financial KPIs — year to date. */}
      <section className="space-y-3">
        <h2 className="section-label">{t('kpis.title')}</h2>
        <div className="grid gap-grid sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t('kpis.revenue')}
            icon={TrendingUp}
            tone="positive"
            value={
              inc?.totalRevenue != null ? money(inc.totalRevenue) : undefined
            }
            hint={t('kpis.ytd')}
            isLoading={income.isLoading}
            isError={income.isError}
          />
          <KpiCard
            label={t('kpis.expenses')}
            icon={TrendingDown}
            value={
              inc?.totalExpenses != null ? money(inc.totalExpenses) : undefined
            }
            hint={t('kpis.ytd')}
            isLoading={income.isLoading}
            isError={income.isError}
          />
          <KpiCard
            label={t('kpis.netResult')}
            icon={Coins}
            tone={net == null ? 'default' : net >= 0 ? 'positive' : 'negative'}
            value={net != null ? money(net) : undefined}
            hint={
              net == null
                ? t('kpis.ytd')
                : net >= 0
                  ? t('kpis.profit')
                  : t('kpis.loss')
            }
            isLoading={income.isLoading}
            isError={income.isError}
          />
          <KpiCard
            label={t('kpis.inventoryValue')}
            icon={Boxes}
            value={
              valuation.data
                ? formatMoney(
                    valuation.data.totalValue,
                    lookupCurrency(valuation.data.currency),
                    lang
                  )
                : undefined
            }
            hint={t('kpis.atCost')}
            isLoading={valuation.isLoading}
            isError={valuation.isError}
          />
        </div>
      </section>

      {/* Needs attention + recent sales. */}
      <div className="grid gap-grid lg:grid-cols-2">
        <AttentionCard items={attention} />

        <RecentCard
          title={t('recent.salesTitle')}
          viewAllTo="/app/sales-invoices"
          isLoading={recentSales.isLoading}
          isEmpty={(recentSales.data?.data.length ?? 0) === 0}
          emptyLabel={t('recent.salesEmpty')}
        >
          {recentSales.data?.data.map((inv) => (
            <RecentRow
              key={inv.id}
              to={`/app/sales-invoices/${inv.id}`}
              title={inv.invoiceNo}
              subtitle={partnerName(inv.customerId)}
              amount={formatMoney(
                inv.grandTotal,
                lookupCurrency(inv.currencyCode),
                lang
              )}
              meta={
                <span className="text-text-muted">
                  {formatDate(inv.invoiceDate, lang)}
                </span>
              }
            />
          ))}
        </RecentCard>
      </div>

      {/* Recent payments + business at a glance. */}
      <div className="grid gap-grid lg:grid-cols-2">
        <RecentCard
          title={t('recent.paymentsTitle')}
          viewAllTo="/app/payments"
          isLoading={recentPayments.isLoading}
          isEmpty={(recentPayments.data?.data.length ?? 0) === 0}
          emptyLabel={t('recent.paymentsEmpty')}
        >
          {recentPayments.data?.data.map((p) => (
            <RecentRow
              key={p.id}
              to={`/app/payments/${p.id}`}
              title={p.paymentNo}
              subtitle={`${partnerName(p.partnerId)} · ${t(
                `recent.direction.${p.direction}`
              )}`}
              amount={formatMoney(
                p.amountOriginal,
                lookupCurrency(p.currencyCode),
                lang
              )}
              meta={
                <span className="text-text-muted">
                  {formatDate(p.paymentDate, lang)}
                </span>
              }
            />
          ))}
        </RecentCard>

        <section className="space-y-3">
          <h2 className="section-label">{t('glance.title')}</h2>
          <div className="grid gap-grid sm:grid-cols-2">
            <StatCard
              label={t('cards.partners')}
              icon={Users}
              value={partnersCount.data}
              isLoading={partnersCount.isLoading}
              isError={partnersCount.isError}
            />
            <StatCard
              label={t('cards.items')}
              icon={Package}
              value={itemsCount.data}
              isLoading={itemsCount.isLoading}
              isError={itemsCount.isError}
            />
            <StatCard
              label={t('cards.users')}
              icon={UsersRound}
              value={usersCount.data}
              isLoading={usersCount.isLoading}
              isError={usersCount.isError}
            />
            <StatCard
              label={t('cards.accounts')}
              icon={BookOpen}
              value={accountsCount.data}
              isLoading={accountsCount.isLoading}
              isError={accountsCount.isError}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
