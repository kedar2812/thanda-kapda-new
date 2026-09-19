import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity as ActivityIcon, Archive, Pencil, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
import { Page } from '@/components/Layout'
import { matches } from '@/components/common'
import { Empty, Group, Loading, Row, SearchField, cx } from '@/components/ui'
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
}

export default function ActivityPage() {
  const { data, isLoading } = useQuery({ queryKey: ['list', 'activity'], queryFn: () => get<Activity[]>('activity?limit=500') })
  const [q, setQ] = useState('')
  const shown = useMemo(() => (data ?? []).filter((a) => matches(q, a.summary, a.user, a.action)), [data, q])
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
    <Page title="Activity" subtitle="Who added, changed or deleted what — newest first." toolbar={<div className="md:w-80"><SearchField value={q} onChange={setQ} placeholder="Search activity" /></div>}>
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
