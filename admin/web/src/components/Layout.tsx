import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity, Boxes, ChevronRight, Clock, Gift, House, LayoutGrid, Package, Receipt, ReceiptIndianRupee, Settings, ShoppingBag, Wallet, type LucideIcon,
} from 'lucide-react'
import { useBoot, useSyncState } from '@/lib/data'
import { cx, Group } from './ui'

interface NavItem { to: string; label: string; icon: LucideIcon; hint?: string }

export const NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: House },
  { to: '/sales', label: 'Sales', icon: ShoppingBag, hint: 'Direct sales and payments' },
  { to: '/receivables', label: 'Money owed to us', icon: Clock, hint: 'Who owes us, and for how long' },
  { to: '/stock', label: 'Stock', icon: Boxes, hint: 'Stock of each design at each place' },
  { to: '/money', label: 'Money', icon: Wallet, hint: 'Account balances and transfers' },
  { to: '/expenses', label: 'Expenses', icon: Receipt, hint: 'Everything we spend' },
  { to: '/amazon', label: 'Amazon', icon: Package, hint: 'Orders and payouts' },
  { to: '/samples', label: 'Samples', icon: Gift, hint: 'Free wipes given to cafés' },
  { to: '/gst', label: 'GST', icon: ReceiptIndianRupee, hint: 'Purchase and sales registers' },
  { to: '/activity', label: 'Activity', icon: Activity, hint: 'Who changed what, and when' },
  { to: '/settings', label: 'Settings', icon: Settings, hint: 'Lists, team, theme, backup' },
]

const TABS: NavItem[] = [
  NAV[0],
  NAV[1],
  NAV[3],
  NAV[4],
  { to: '/more', label: 'More', icon: LayoutGrid },
]

export function SyncBadge({ compact }: { compact?: boolean }) {
  const state = useSyncState()
  const label = state === 'live' ? 'Live' : state === 'syncing' ? 'Updating' : 'Offline'
  return (
    <span
      className={cx('inline-flex items-center gap-1.5 text-[0.75rem] font-medium', state === 'offline' ? 'text-red' : 'text-label-2')}
      title={state === 'offline' ? 'No connection — new entries will not save until you are back online' : 'Changes from partners appear automatically'}
      role="status"
    >
      <span className="relative flex size-2">
        {state !== 'offline' && <span className={cx('absolute inline-flex size-full rounded-full opacity-60', state === 'syncing' ? 'animate-ping bg-orange' : 'bg-green')} />}
        <span className={cx('relative inline-flex size-2 rounded-full', state === 'live' && 'bg-green', state === 'syncing' && 'bg-orange', state === 'offline' && 'bg-red')} />
      </span>
      {!compact && label}
    </span>
  )
}

function Sidebar() {
  const { data } = useBoot()
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-separator px-3 py-5 md:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <img src="/logo-mark.png" alt="" className="size-9 rounded-xl bg-surface object-contain p-1 shadow-card" />
        <div className="leading-tight">
          <div className="text-[0.9375rem] font-semibold">Thanda Kapda</div>
          <div className="text-[0.75rem] text-label-2">Business dashboard</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto no-scrollbar">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              cx(
                'pressable flex items-center gap-2.5 rounded-[0.625rem] px-2.5 py-2 text-[0.9375rem]',
                isActive ? 'bg-accent-soft font-semibold text-accent' : 'text-label hover:bg-fill',
              )
            }
          >
            <n.icon className="size-[1.125rem]" strokeWidth={2} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 flex items-center justify-between rounded-xl px-2.5 py-2">
        <div className="min-w-0">
          <div className="truncate text-[0.8125rem] font-medium">{data?.user.name}</div>
          <SyncBadge />
        </div>
      </div>
    </aside>
  )
}

function TabBar() {
  const { pathname } = useLocation()
  const inMore = !TABS.slice(0, 4).some((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)))
  return (
    <nav className="chrome fixed inset-x-0 bottom-0 z-40 border-t border-separator safe-bottom md:hidden" aria-label="Main">
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.to === '/more' ? inMore : t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)
          return (
            <NavLink key={t.to} to={t.to} className="pressable flex flex-col items-center gap-0.5 pt-2 pb-1.5" aria-current={active ? 'page' : undefined}>
              <t.icon className={cx('size-6', active ? 'text-accent' : 'text-label-3')} strokeWidth={active ? 2.2 : 1.9} />
              <span className={cx('text-[0.625rem] font-medium', active ? 'text-accent' : 'text-label-2')}>{t.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function Shell() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}

/**
 * iOS-style page: a large title that hands off to a small centred title in a
 * translucent bar once it scrolls away.
 */
export function Page({ title, subtitle, actions, toolbar, children, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; toolbar?: ReactNode; children: ReactNode; back?: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [condensed, setCondensed] = useState(false)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCondensed(!e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header
        className={cx(
          'sticky top-0 z-30 safe-top transition-[background-color,border-color] duration-200',
          condensed ? 'chrome border-b border-separator' : 'border-b border-transparent',
        )}
      >
        <div className="flex h-12 items-center justify-between gap-2 px-3 md:h-14 md:px-8">
          <div className="flex min-w-0 items-center gap-1">
            {back}
            <div className="md:hidden">
              <SyncBadge compact />
            </div>
          </div>
          <AnimatePresence>
            {condensed && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-[1.0625rem] font-semibold"
              >
                {title}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        </div>
      </header>
      <div className="px-4 md:px-8">
        <div ref={sentinel} className="mb-5 flex flex-wrap items-end justify-between gap-3 pt-1">
          <div className="min-w-0">
            <h1 className="display text-[2.125rem] font-bold">{title}</h1>
            {subtitle && <p className="mt-1 text-[0.9375rem] text-label-2">{subtitle}</p>}
          </div>
        </div>
        {toolbar && <div className="mb-5">{toolbar}</div>}
        {children}
      </div>
    </div>
  )
}

export function MorePage() {
  return (
    <Page title="More">
      <Group>
        {NAV.filter((n) => !['/', '/sales', '/stock', '/money'].includes(n.to)).map((n) => (
          <NavLink key={n.to} to={n.to} className="row-press group flex items-center gap-3 pl-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
              <n.icon className="size-[1.125rem]" strokeWidth={2} />
            </span>
            <span className="flex min-h-[3.5rem] flex-1 items-center gap-2 border-b border-separator py-2 pr-4 group-last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem]">{n.label}</span>
                <span className="block truncate text-[0.8125rem] text-label-2">{n.hint}</span>
              </span>
              <ChevronRight className="size-4 text-label-3" strokeWidth={2.5} />
            </span>
          </NavLink>
        ))}
      </Group>
    </Page>
  )
}
