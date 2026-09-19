import { useEffect, useRef, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { spring } from './ui'

const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null
export function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      mq?.addEventListener('change', cb)
      return () => mq?.removeEventListener('change', cb)
    },
    () => mq?.matches ?? true,
  )
}

/** Apple's momentum projection: where a flick would come to rest. */
function project(velocity: number, rate = 0.998) {
  return ((velocity / 1000) * rate) / (1 - rate)
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** When set, the sheet is a form with Cancel / <submitLabel> in the header. */
  onSubmit?: () => void
  submitLabel?: string
  busy?: boolean
  footer?: ReactNode
  wide?: boolean
}

export function Sheet(props: SheetProps) {
  return <AnimatePresence>{props.open && <SheetBody {...props} />}</AnimatePresence>
}

function SheetBody({ onClose, title, children, onSubmit, submitLabel = 'Save', busy, footer, wide }: SheetProps) {
  const desktop = useIsDesktop()
  const reduce = useReducedMotion()
  const y = useMotionValue(0)
  const drag = useDragControls()
  const panel = useRef<HTMLDivElement>(null)
  // The scrim lightens as the sheet is pulled down, so the gesture reads continuously.
  const scrimOpacity = useTransform(y, [0, 500], [1, 0.2])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!busy) onSubmit?.()
  }

  const header = (
    <div
      className="relative flex h-14 shrink-0 items-center justify-between px-2 touch-none md:touch-auto"
      onPointerDown={(e) => !desktop && drag.start(e)}
    >
      {!desktop && <div className="absolute top-1.5 left-1/2 h-[5px] w-9 -translate-x-1/2 rounded-full bg-fill-strong" />}
      <button type="button" onClick={onClose} className="pressable rounded-lg px-2.5 py-1.5 text-[1.0625rem] text-accent">
        {onSubmit ? 'Cancel' : 'Close'}
      </button>
      <h2 className="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate text-[1.0625rem] font-semibold">{title}</h2>
      {onSubmit ? (
        <button type="submit" disabled={busy} className="pressable rounded-lg px-2.5 py-1.5 text-[1.0625rem] font-semibold text-accent disabled:opacity-40">
          {busy ? 'Saving…' : submitLabel}
        </button>
      ) : (
        <span className="w-16" />
      )}
    </div>
  )

  const content = (
    <>
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-separator px-4 py-3 safe-bottom md:px-6">{footer}</div>}
    </>
  )

  const Wrapper = onSubmit ? 'form' : 'div'

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div
        className="absolute inset-0 bg-[var(--scrim)]"
        style={desktop ? undefined : { opacity: scrimOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      {desktop ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={spring}
            className={`pointer-events-auto flex max-h-[min(88vh,56rem)] w-full flex-col overflow-hidden rounded-[1.25rem] bg-elevated shadow-sheet ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
          >
            <Wrapper onSubmit={onSubmit ? submit : undefined} className="flex min-h-0 flex-1 flex-col" noValidate>
              {content}
            </Wrapper>
          </motion.div>
        </div>
      ) : (
        <motion.div
          ref={panel}
          style={{ y }}
          initial={reduce ? { opacity: 0 } : { y: '100%' }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          drag="y"
          dragListener={false}
          dragControls={drag}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.06, bottom: 1 }}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const h = panel.current?.offsetHeight ?? 600
            const resting = y.get() + project(info.velocity.y)
            if (resting > h * 0.45) onClose()
            else animate(y, 0, { type: 'spring', bounce: 0, duration: 0.35, velocity: info.velocity.y })
          }}
          className="absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-2.5rem)] flex-col rounded-t-[1.25rem] bg-elevated shadow-sheet"
        >
          <Wrapper onSubmit={onSubmit ? submit : undefined} className="flex min-h-0 flex-1 flex-col safe-bottom" noValidate>
            {content}
          </Wrapper>
        </motion.div>
      )}
    </div>
  )
}
