import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity as ActivityIcon, Archive, ImagePlus, Pencil, Plus, RotateCcw, Send, Trash2, Undo2, Upload } from 'lucide-react'
import { Page } from '@/components/Layout'
import { matches } from '@/components/common'
import { Toolbar } from '@/components/common'
import { Empty, Group, Loading, Row, SearchField, Segmented, cx } from '@/components/ui'
import { get } from '@/lib/api'
import { date, relative } from '@/lib/format'
import type { Activity } from '@/lib/types'

const ICONS: Record<string, { icon: typeof Plus; tone: string }> = {
  added: { icon: Plus, tone: 'bg-green-soft text-green' },
  edited: { icon: Pencil, tone: 'bg-accent-soft text-accent' },
  deleted: { icon: Trash2, tone: 'bg-red-soft text-red' },
  archived: { icon: Archive, tone: 'bg-orange-soft text-orange' },
  restored: { icon: RotateCcw, tone: 'bg-accent-soft text-accent' },
  imported: { icon: Upload, tone: 'bg-accent-soft text-accent' },
  exported: { icon: Upload, tone: 'bg-fill text-label-2' },
  published: { icon: Send, tone: 'bg-green-soft text-green' },
  uploaded: { icon: ImagePlus, tone: 'bg-accent-soft text-accent' },
  discarded: { icon: Undo2, tone: 'bg-orange-soft text-orange' },
}

type ActionFilter = 'all' | 'added' | 'edited' | 'removed'

export default function ActivityPage() {
  const { data, isLoading } = useQuery({ queryKey: ['list', 'activity'], queryFn: () => get<Activity[]>('activity?limit=500') })
  const [q, setQ] = useState('')
  const [action, setAction] = useState<ActionFilter>('all')
  const shown = useMemo(
    () => (data ?? []).filter((a) => (action === 'all' || (action === 'removed' ? ['deleted', 'archived'].includes(a.action) : a.action === action)) && matches(q, a.summary, a.user, a.action)),
    [data, q, action],
  )
  const byDay = useMemo(() => {
    const groups: { day: string; items: Activity[] }[] = []
    for (const a of shown) {
      const day = a.at.slice(0, 10)
      if (groups.at(-1)?.day === day) groups.at(-1)!.items.push(a)
      else groups.push({ day, items: [a] })
    }
    return groups
  }, [shown])

  return (
    <Page
      title="Activity"
      subtitle="Who added, changed or deleted what — newest first. Includes the old dashboard’s audit trail once it’s brought over."
      toolbar={
        <Toolbar>
          <div className="md:w-80"><SearchField value={q} onChange={setQ} placeholder="Search activity, person or screen" /></div>
          <Segmented<ActionFilter> value={action} onChange={setAction} options={[{ value: 'all', label: 'All' }, { value: 'added', label: 'Added' }, { value: 'edited', label: 'Edited' }, { value: 'removed', label: 'Deleted' }]} className="md:w-80" />
        </Toolbar>
      }
    >
      {isLoading ? (
        <Loading />
      ) : !shown.length ? (
        <Empty icon={<ActivityIcon className="size-7" />} title="Nothing yet" />
      ) : (
        byDay.map((g) => (
          <Group key={g.day} title={date(g.day)}>
            {g.items.map((a) => {
              const meta = ICONS[a.action] ?? ICONS.edited
              return (
                <Row
                  key={a.id}
                  leading={<span className={cx('grid size-8 shrink-0 place-items-center rounded-full', meta.tone)}><meta.icon className="size-4" strokeWidth={2.4} /></span>}
                  title={<><span className="font-medium">{a.user ?? 'Someone'}</span> <span className="text-label-2">{a.action}</span></>}
                  subtitle={a.summary}
                  trailingSub={relative(a.at)}
                />
              )
            })}
          </Group>
        ))
      )}
    </Page>
  )
}
