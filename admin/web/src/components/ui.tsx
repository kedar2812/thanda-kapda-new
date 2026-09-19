import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertTriangle, Check, ChevronRight, Search, X } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Apple's default: critically damped, ~0.35s response. */
export const spring = { type: 'spring', bounce: 0, duration: 0.35 } as const
export const springBouncy = { type: 'spring', bounce: 0.18, duration: 0.4 } as const

// ---------------------------------------------------------------- buttons

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'tinted' | 'plain' | 'destructive' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'pressable inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold select-none whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' && 'h-8 px-3 text-[0.8125rem]',
        size === 'md' && 'h-10 px-4 text-[0.9375rem]',
        size === 'lg' && 'h-[3.125rem] px-5 text-[1.0625rem] rounded-[0.875rem]',
        variant === 'primary' && 'bg-accent text-on-accent active:bg-accent-press',
        variant === 'tinted' && 'bg-accent-soft text-accent',
        variant === 'gray' && 'bg-fill text-label',
        variant === 'plain' && 'text-accent px-2',
        variant === 'destructive' && 'bg-red-soft text-red',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({ label, className, children, ...rest }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx('pressable grid size-9 place-items-center rounded-full text-accent hover:bg-fill active:bg-fill-strong', className)}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------- grouped lists

export function Group({ title, footer, action, children, className }: { title?: ReactNode; footer?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('mb-7', className)}>
      {(title || action) && (
        <div className="mb-1.5 flex items-end justify-between px-4">
          {title && <h2 className="text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-label-2">{title}</h2>}
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[0.8125rem] text-label-2">{footer}</p>}
    </section>
  )
}

export function Row({
  title, subtitle, trailing, trailingSub, onClick, chevron = !!onClick, leading, className, tone,
}: {
  title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; trailingSub?: ReactNode
  onClick?: () => void; chevron?: boolean; leading?: ReactNode; className?: string; tone?: 'red' | 'muted'
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'group flex w-full items-center gap-3 pl-4 text-left',
        onClick && 'row-press transition-colors',
        className,
      )}
    >
      {leading}
      <div className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-3 border-b border-separator py-2.5 pr-4 group-last:border-b-0">
        <div className="min-w-0 flex-1">
          <div className={cx('truncate text-[0.9375rem] leading-snug', tone === 'muted' && 'text-label-2')}>{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-[0.8125rem] text-label-2">{subtitle}</div>}
        </div>
        {(trailing || trailingSub) && (
          <div className="shrink-0 text-right">
            <div className={cx('num text-[0.9375rem]', tone === 'red' && 'text-red')}>{trailing}</div>
            {trailingSub && <div className="mt-0.5 text-[0.75rem] text-label-2">{trailingSub}</div>}
          </div>
        )}
        {chevron && <ChevronRight className="size-4 shrink-0 text-label-3" strokeWidth={2.5} />}
      </div>
    </Tag>
  )
}

export function Badge({ tone = 'gray', children }: { tone?: 'green' | 'orange' | 'red' | 'gray' | 'accent' | 'gold'; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.03em]',
        tone === 'green' && 'bg-green-soft text-green',
        tone === 'orange' && 'bg-orange-soft text-orange',
        tone === 'red' && 'bg-red-soft text-red',
        tone === 'gray' && 'bg-fill text-label-2',
        tone === 'accent' && 'bg-accent-soft text-accent',
        tone === 'gold' && 'bg-gold-soft text-gold',
      )}
    >
      {children}
    </span>
  )
}

// ---------------------------------------------------------------- stats

export function Stat({ label, value, sub, tone, onClick, className }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'green' | 'red' | 'accent'; onClick?: () => void; className?: string }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx('flex min-w-0 flex-col rounded-2xl bg-surface p-4 text-left shadow-card', onClick && 'pressable', className)}
    >
      <span className="text-[0.8125rem] font-medium text-label-2">{label}</span>
      <span
        className={cx(
          'num display mt-1 truncate text-[1.375rem] font-semibold md:text-[1.5rem]',
          tone === 'green' && 'text-green',
          tone === 'red' && 'text-red',
          tone === 'accent' && 'text-accent',
        )}
      >
        {value}
      </span>
      {sub && <span className="mt-0.5 truncate text-[0.75rem] text-label-2">{sub}</span>}
    </Tag>
  )
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>
}

// ---------------------------------------------------------------- segmented control

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  const id = useId()
  return (
    <div role="tablist" className={cx('relative flex rounded-[0.625rem] bg-fill p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="relative z-0 flex-1 rounded-[0.5rem] px-3 py-1.5 text-[0.8125rem] font-semibold whitespace-nowrap"
          >
            {active && (
              <motion.span
                layoutId={id}
                transition={spring}
                className="absolute inset-0 -z-10 rounded-[0.5rem] bg-elevated shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)] dark:bg-[#636366]"
              />
            )}
            <span className={active ? 'text-label' : 'text-label-2'}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- search

export function SearchField({ value, onChange, placeholder = 'Search' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex h-9 items-center gap-1.5 rounded-[0.625rem] bg-fill px-2.5 text-label-2">
      <Search className="size-4 shrink-0" strokeWidth={2.4} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-label outline-none placeholder:text-label-3 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="grid size-5 place-items-center rounded-full bg-label-3 text-surface">
          <X className="size-3" strokeWidth={3} />
        </button>
      )}
    </label>
  )
}

// ---------------------------------------------------------------- form fields

export function Field({ label, required, hint, children, className }: { label: string; required?: boolean; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-baseline gap-1 px-1 text-[0.8125rem] font-medium text-label-2">
        {label}
        {required && <span className="text-red" aria-label="required">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block px-1 text-[0.8125rem] text-label-2">{hint}</span>}
    </label>
  )
}

const inputCls =
  'block h-12 w-full rounded-xl bg-surface-2 px-3.5 text-[0.9375rem] text-label outline-none ring-accent/0 transition-shadow placeholder:text-label-3 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]'

export function TextInput(props: ComponentProps<'input'>) {
  return <input type="text" autoComplete="off" {...props} className={cx(inputCls, props.className)} />
}

export function TextArea(props: ComponentProps<'textarea'>) {
  return <textarea rows={2} {...props} className={cx(inputCls, 'h-auto min-h-12 py-3 leading-snug', props.className)} />
}

/** Opens the numeric keypad on phones. Keeps the raw string so typing "12." works. */
export function NumberInput({ value, onChange, decimal = true, prefix, ...rest }: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & { value: string; onChange: (v: string) => void; decimal?: boolean; prefix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.9375rem] text-label-2">{prefix}</span>}
      <input
        {...rest}
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        pattern={decimal ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/,/g, '')
          if (v === '' || (decimal ? /^\d*\.?\d{0,2}$/ : /^\d*$/).test(v)) onChange(v)
        }}
        className={cx(inputCls, 'num', prefix && 'pl-8', rest.className)}
      />
    </div>
  )
}

export function DateInput(props: ComponentProps<'input'>) {
  return <input type="date" {...props} className={cx(inputCls, 'num appearance-none', props.className)} />
}

export function Select({ value, onChange, children, placeholder = 'Choose…', ...rest }: Omit<ComponentProps<'select'>, 'onChange'> & { onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        {...rest}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, 'appearance-none pr-9', (value === '' || value == null) && 'text-label-3')}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronRight className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rotate-90 text-label-3" strokeWidth={2.5} />
    </div>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}

export function Notice({ tone = 'orange', children }: { tone?: 'orange' | 'red' | 'accent'; children: ReactNode }) {
  return (
    <div
      role={tone === 'red' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2 rounded-xl px-3.5 py-3 text-[0.875rem] leading-snug',
        tone === 'orange' && 'bg-orange-soft text-orange',
        tone === 'red' && 'bg-red-soft text-red',
        tone === 'accent' && 'bg-accent-soft text-accent',
      )}
    >
      {tone !== 'accent' && <AlertTriangle className="mt-px size-4 shrink-0" strokeWidth={2.4} />}
      <div>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------- empty / loading

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-fill text-label-2">{icon}</div>}
      <p className="text-[1.0625rem] font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-[0.9375rem] text-label-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Loading() {
  return (
    <div className="grid place-items-center py-20" aria-busy="true" aria-label="Loading">
      <div className="size-6 animate-spin rounded-full border-[2.5px] border-fill-strong border-t-label-2" />
    </div>
  )
}

// ---------------------------------------------------------------- toasts

interface Toast { id: number; text: string; tone: 'ok' | 'error' }
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'error') => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const reduce = useReducedMotion()
  const show = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = ++seq.current
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 5000 : 2400)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.96 }}
              transition={spring}
              className="chrome flex max-w-md items-center gap-2 rounded-full px-4 py-2.5 text-[0.875rem] font-medium shadow-[0_8px_30px_rgba(0,0,0,0.16)] ring-1 ring-separator"
            >
              {t.tone === 'ok' ? <Check className="size-4 text-green" strokeWidth={3} /> : <AlertTriangle className="size-4 text-red" strokeWidth={2.4} />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

// ---------------------------------------------------------------- confirm

interface ConfirmOpts { title: string; body?: ReactNode; confirm: string; destructive?: boolean }
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false)
export const useConfirm = () => useContext(ConfirmCtx)

/** In-app confirmation (never the browser's blocking confirm()). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const ask = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), [])
  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="absolute inset-0 bg-[var(--scrim)]" onClick={() => close(false)} />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={spring}
              className="chrome relative w-full max-w-[18.5rem] overflow-hidden rounded-[1.25rem] text-center shadow-sheet"
            >
              <div className="px-5 pt-5 pb-4">
                <h3 id="confirm-title" className="text-[1.0625rem] font-semibold">{state.title}</h3>
                {state.body && <div className="mt-1 text-[0.8125rem] leading-snug text-label-2">{state.body}</div>}
              </div>
              <div className="grid grid-cols-2 border-t border-separator">
                <button type="button" className="row-press h-11 border-r border-separator text-[1.0625rem] text-accent" onClick={() => close(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  className={cx('row-press h-11 text-[1.0625rem] font-semibold', state.destructive ? 'text-red' : 'text-accent')}
                  onClick={() => close(true)}
                >
                  {state.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmCtx.Provider>
  )
}
