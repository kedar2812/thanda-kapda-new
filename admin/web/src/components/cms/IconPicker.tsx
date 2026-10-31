import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { Icon, iconNames } from '@site/icons'
import { cx, spring } from '@/components/ui'

/** "globePlane" → "Globe plane" */
const nice = (name: string) => name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

/** Picks one of the website's own line icons, drawn exactly as the site draws them. */
export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const shown = iconNames.filter((n) => !q || n.toLowerCase().includes(q.toLowerCase().replace(/\s/g, '')))
  const known = iconNames.includes(value as (typeof iconNames)[number])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="pressable flex h-12 w-full items-center gap-3 rounded-xl bg-surface-2 px-3 text-left"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-[#143829] text-[#e3c27d]">
          {known ? <Icon name={value} className="size-5" /> : <span className="text-[0.75rem]">?</span>}
        </span>
        <span className={cx('flex-1 text-[0.9375rem]', !known && 'text-label-3')}>{known ? nice(value) : 'Choose an icon'}</span>
        <ChevronDown className="size-4 text-label-3" strokeWidth={2.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={spring}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 rounded-2xl bg-elevated p-2 shadow-sheet ring-1 ring-separator"
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search icons"
              className="mb-2 h-9 w-full rounded-[0.625rem] bg-fill px-3 text-[0.9375rem] outline-none placeholder:text-label-3"
            />
            <div className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto overscroll-contain sm:grid-cols-6">
              {shown.map((n) => (
                <button
                  key={n}
                  type="button"
                  title={nice(n)}
                  onClick={() => {
                    onChange(n)
                    setOpen(false)
                  }}
                  className={cx('pressable flex flex-col items-center gap-1 rounded-xl p-2 text-[0.625rem] text-label-2', n === value ? 'bg-accent-soft text-accent' : 'hover:bg-fill')}
                >
                  <Icon name={n} className={cx('size-7', n === value ? 'text-accent' : 'text-label')} />
                  <span className="w-full truncate text-center">{nice(n)}</span>
                </button>
              ))}
              {shown.length === 0 && <p className="col-span-full p-3 text-center text-[0.875rem] text-label-2">No icons match.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
