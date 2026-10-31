import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { Field, ListField } from '@site/content/types'
import { blankLike } from '@site/content/normalize'
import { emptyImage, getAt, same } from '@/lib/content'
import { Button, cx, spring, useConfirm } from '@/components/ui'
import { useEditor, useField } from './editor'
import { IconPicker } from './IconPicker'
import { ImageEditor } from './ImageEditor'

const inputCls =
  'block w-full rounded-xl bg-surface-2 px-3.5 text-[0.9375rem] text-label outline-none transition-shadow placeholder:text-label-3 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]'

/** Label row shared by every field: name, "edited" marker with undo, and an optional counter. */
export function FieldLabel({ label, changed, onRevert, extra, htmlFor }: { label: string; changed: boolean; onRevert: () => void; extra?: ReactNode; htmlFor?: string }) {
  return (
    <div className="mb-1.5 flex min-h-5 items-center gap-2 px-1">
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-label-2">
        {label}
      </label>
      {changed && (
        <>
          <span className="size-1.5 rounded-full bg-orange" aria-label="Edited, not published yet" title="Edited, not published yet" />
          <button type="button" onClick={onRevert} className="pressable inline-flex items-center gap-1 text-[0.75rem] font-medium text-accent" title="Go back to what is live on the website">
            <RotateCcw className="size-3" strokeWidth={2.4} /> Undo
          </button>
        </>
      )}
      <span className="ml-auto">{extra}</span>
    </div>
  )
}

function Hint({ children }: { children?: ReactNode }) {
  return children ? <p className="mt-1.5 px-1 text-[0.8125rem] leading-snug text-label-2">{children}</p> : null
}

/** A textarea that grows with its text. */
function AutoText({ value, onChange, id, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; id: string; placeholder?: string; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx(inputCls, 'min-h-12 resize-none overflow-hidden py-3 leading-snug')}
    />
  )
}

const fieldId = (path: string) => `f-${path.replace(/\./g, '-')}`

function TextEditor({ field, path }: { field: Extract<Field, { kind: 'text' }>; path: string }) {
  const f = useField<string>(path)
  const id = fieldId(path)
  const len = f.value?.length ?? 0
  const over = field.max !== undefined && len > field.max
  const counter = field.max ? <span className={cx('num text-[0.75rem]', over ? 'font-semibold text-orange' : 'text-label-3')}>{len}/{field.max}</span> : null
  return (
    <div>
      <FieldLabel label={field.label} changed={f.changed} onRevert={f.revert} extra={counter} htmlFor={id} />
      {field.long || field.rich ? (
        <AutoText id={id} value={f.value ?? ''} onChange={f.set} placeholder={field.placeholder} rows={field.rich ? 1 : 2} />
      ) : (
        <input id={id} type="text" value={f.value ?? ''} onChange={(e) => f.set(e.target.value)} placeholder={field.placeholder} className={cx(inputCls, 'h-12')} autoComplete="off" />
      )}
      <Hint>{over ? `Longer than the ${field.max} characters that fit well here.` : field.hint}</Hint>
    </div>
  )
}

function validUrl(v: string) {
  return v === '' || /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d][\d\s-]*|\/[^\s]*)$/i.test(v.trim())
}

function UrlEditor({ field, path }: { field: Extract<Field, { kind: 'url' }>; path: string }) {
  const f = useField<string>(path)
  const id = fieldId(path)
  const ok = validUrl(f.value ?? '')
  return (
    <div>
      <FieldLabel
        label={field.label}
        changed={f.changed}
        onRevert={f.revert}
        htmlFor={id}
        extra={
          f.value && ok && /^https?:/.test(f.value) ? (
            <a href={f.value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-accent">
              Open <ExternalLink className="size-3" />
            </a>
          ) : null
        }
      />
      <input id={id} type="url" inputMode="url" value={f.value ?? ''} onChange={(e) => f.set(e.target.value.trim())} placeholder={field.placeholder ?? 'https://'} className={cx(inputCls, 'h-12', !ok && 'ring-2 ring-red/50')} autoComplete="off" spellCheck={false} />
      <Hint>{ok ? field.hint : 'This doesn’t look like a web address. It should start with https://'}</Hint>
    </div>
  )
}

function NumberEditor({ field, path }: { field: Extract<Field, { kind: 'number' }>; path: string }) {
  const f = useField<number>(path)
  const id = fieldId(path)
  // Keep what's typed ("4." on the way to "4.5") separate from the stored number.
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(f.value ?? 0)
  const commit = (raw: string) => {
    setDraft(raw)
    const n = Number(raw.replace(/,/g, ''))
    if (raw.trim() !== '' && Number.isFinite(n)) {
      const clamped = Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, n))
      f.set(clamped)
    }
  }
  return (
    <div>
      <FieldLabel label={field.label} changed={f.changed} onRevert={() => { setDraft(null); f.revert() }} htmlFor={id} />
      <div className="relative">
        {field.prefix && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.9375rem] text-label-2">{field.prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={shown}
          onChange={(e) => /^-?[\d,]*\.?\d*$/.test(e.target.value) && commit(e.target.value)}
          onBlur={() => setDraft(null)}
          className={cx(inputCls, 'num h-12', field.prefix && 'pl-8')}
          autoComplete="off"
        />
      </div>
      <Hint>{field.hint}</Hint>
    </div>
  )
}

function ToggleEditor({ field, path }: { field: Extract<Field, { kind: 'toggle' }>; path: string }) {
  const f = useField<boolean>(path)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3.5 py-3">
      <div className="min-w-0">
        <span className="text-[0.9375rem]">{field.label}</span>
        {f.changed && <span className="ml-2 inline-block size-1.5 rounded-full bg-orange align-middle" title="Edited, not published yet" />}
        {field.hint && <p className="text-[0.8125rem] text-label-2">{field.hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!f.value}
        aria-label={field.label}
        onClick={() => f.set(!f.value)}
        className={cx('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200', f.value ? 'bg-green' : 'bg-fill-strong')}
      >
        <motion.span layout transition={spring} className={cx('absolute top-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)]', f.value ? 'right-[2px]' : 'left-[2px]')} />
      </button>
    </div>
  )
}

function IconEditor({ field, path }: { field: Extract<Field, { kind: 'icon' }>; path: string }) {
  const f = useField<string>(path)
  return (
    <div>
      <FieldLabel label={field.label} changed={f.changed} onRevert={f.revert} />
      <IconPicker value={f.value ?? ''} onChange={f.set} />
    </div>
  )
}

function GroupEditor({ field, path, nested }: { field: Extract<Field, { kind: 'group' }>; path: string; nested?: boolean }) {
  const entries = Object.entries(field.fields)
  const body = (
    <div className={cx('grid gap-4', field.columns === 2 && 'sm:grid-cols-2')}>
      {entries.map(([k, f]) => (
        <FieldEditor key={k} field={f} path={`${path}.${k}`} nested />
      ))}
    </div>
  )
  if (nested) return body
  return (
    <fieldset className="rounded-2xl border border-separator p-4">
      <legend className="px-1.5 text-[0.8125rem] font-semibold text-label">{field.label}</legend>
      {field.hint && <p className="-mt-1 mb-3 text-[0.8125rem] text-label-2">{field.hint}</p>}
      {body}
    </fieldset>
  )
}

/** A fresh list item shaped like the existing ones, with photos ready to fill. */
function blankItem(sample: unknown): unknown {
  const fix = (v: unknown): unknown => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('src' in v && 'focus' in v) return emptyImage()
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)]))
    }
    return v
  }
  return fix(blankLike(sample))
}

function itemTitle(field: ListField, item: unknown, i: number) {
  const t = field.titleKey ? getAt(item, field.titleKey) : undefined
  const s = typeof t === 'string' ? t.replace(/\*/g, '').trim() : ''
  return s || `${field.noun[0].toUpperCase()}${field.noun.slice(1)} ${i + 1}`
}

function ListEditor({ field, path }: { field: ListField; path: string }) {
  const e = useEditor()
  const f = useField<unknown[]>(path)
  const confirm = useConfirm()
  const items = Array.isArray(f.value) ? f.value : []
  const [open, setOpen] = useState<number | null>(null)
  const simple = field.item.kind === 'text'
  const images = field.item.kind === 'image'
  const canAdd = field.max === undefined || items.length < field.max
  const canRemove = items.length > (field.min ?? 0)
  const sample = items[0] ?? getAt(e.published, `${path}.0`) ?? ''

  const move = (i: number, d: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    f.set(next)
    if (open === i) setOpen(i + d)
  }
  const remove = async (i: number) => {
    const isEmpty = same(items[i], blankItem(sample)) || items[i] === ''
    if (!isEmpty && !(await confirm({ title: `Remove this ${field.noun}?`, body: 'You can undo this until you publish.', confirm: 'Remove', destructive: true }))) return
    f.set(items.filter((_, j) => j !== i))
    setOpen(null)
  }
  const add = () => {
    f.set([...items, simple ? '' : blankItem(sample)])
    if (!simple && !images) setOpen(items.length)
  }

  const controls = (i: number) => (
    <div className="flex shrink-0 items-center">
      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="pressable grid size-8 place-items-center rounded-full text-label-2 hover:bg-fill disabled:opacity-25">
        <ArrowUp className="size-4" />
      </button>
      <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="pressable grid size-8 place-items-center rounded-full text-label-2 hover:bg-fill disabled:opacity-25">
        <ArrowDown className="size-4" />
      </button>
      {canRemove && (
        <button type="button" aria-label={`Remove ${field.noun}`} onClick={() => remove(i)} className="pressable grid size-8 place-items-center rounded-full text-red hover:bg-red-soft">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )

  return (
    <div>
      <FieldLabel label={field.label} changed={f.changed} onRevert={f.revert} extra={<span className="num text-[0.75rem] text-label-3">{items.length}{field.max ? ` of ${field.max}` : ''}</span>} />
      {field.hint && <p className="-mt-0.5 mb-2 px-1 text-[0.8125rem] text-label-2">{field.hint}</p>}

      {simple ? (
        <div className="space-y-2">
          {items.map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="text"
                aria-label={`${field.noun} ${i + 1}`}
                value={String(items[i] ?? '')}
                onChange={(ev) => e.set(`${path}.${i}`, ev.target.value)}
                className={cx(inputCls, 'h-11')}
                autoComplete="off"
              />
              {controls(i)}
            </div>
          ))}
        </div>
      ) : images ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((_, i) => (
            <div key={i} className="rounded-2xl border border-separator p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.8125rem] font-medium text-label-2">{itemTitle(field, null, i)}</span>
                {controls(i)}
              </div>
              <ImageEditor field={{ ...(field.item as Extract<Field, { kind: 'image' }>), label: '' }} path={`${path}.${i}`} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-separator">
          {items.map((item, i) => {
            const expanded = open === i
            return (
              <div key={i} className="border-b border-separator last:border-b-0">
                <div className="flex items-center gap-1 pr-1.5">
                  <button type="button" onClick={() => setOpen(expanded ? null : i)} aria-expanded={expanded} className="row-press flex min-h-12 min-w-0 flex-1 items-center gap-2 px-3.5 text-left">
                    <ChevronDown className={cx('size-4 shrink-0 text-label-3 transition-transform duration-200', expanded ? '' : '-rotate-90')} strokeWidth={2.5} />
                    <span className="truncate text-[0.9375rem]">{itemTitle(field, item, i)}</span>
                    {!same(item, getAt(e.published, `${path}.${i}`)) && <span className="size-1.5 shrink-0 rounded-full bg-orange" title="Edited" />}
                  </button>
                  {controls(i)}
                </div>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} className="overflow-hidden">
                      <div className="border-t border-separator bg-surface-2/40 p-3.5">
                        <FieldEditor field={field.item} path={`${path}.${i}`} nested />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {items.length === 0 && <p className="px-4 py-3 text-[0.875rem] text-label-2">Nothing here yet.</p>}
        </div>
      )}

      {canAdd && (
        <Button variant="plain" size="sm" className="mt-2 px-1" icon={<Plus className="size-4" strokeWidth={2.6} />} onClick={add}>
          Add {field.noun}
        </Button>
      )}
    </div>
  )
}

export function FieldEditor({ field, path, nested }: { field: Field; path: string; nested?: boolean }) {
  switch (field.kind) {
    case 'text':
      return <TextEditor field={field} path={path} />
    case 'url':
      return <UrlEditor field={field} path={path} />
    case 'number':
      return <NumberEditor field={field} path={path} />
    case 'toggle':
      return <ToggleEditor field={field} path={path} />
    case 'icon':
      return <IconEditor field={field} path={path} />
    case 'image':
      return <ImageEditor field={field} path={path} />
    case 'group':
      return <GroupEditor field={field} path={path} nested={nested} />
    case 'list':
      return <ListEditor field={field} path={path} />
  }
}
