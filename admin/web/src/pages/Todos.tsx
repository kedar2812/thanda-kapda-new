import { useMemo, useState } from 'react'
import { Check, ListTodo } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { AddButton, DeleteButton, Editor, ExportButton, FormError, Toolbar, downloadCsv, matches, useToday } from '@/components/common'
import { Badge, Button, DateInput, Empty, Field, FormGrid, Group, Loading, Row, SearchField, Segmented, Stat, StatGrid, TextArea, TextInput, cx, useToast } from '@/components/ui'
import { put } from '@/lib/api'
import { useList, useNames } from '@/lib/data'
import { date } from '@/lib/format'
import { toValues, useRecordForm } from '@/lib/form'
import type { Todo } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'

type Filter = 'open' | 'done' | 'all'
const RANK = { High: 0, Medium: 1, Low: 2 } as const
const TONE = { High: 'red', Medium: 'gold', Low: 'green' } as const

export default function Todos() {
  const { data, isLoading } = useList<Todo>('todos')
  const today = useToday()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('open')
  const [editing, setEditing] = useState<Todo | 'new' | null>(null)

  const all = useMemo(() => data ?? [], [data])
  const overdue = (t: Todo) => !t.done && !!t.due && t.due < today
  // Open first, then by priority, then by due date (undated last).
  const shown = useMemo(
    () =>
      all
        .filter((t) => (filter === 'all' || (filter === 'done') === t.done) && matches(q, t.title, t.assignee, t.notes))
        .sort((a, b) => Number(a.done) - Number(b.done) || RANK[a.priority] - RANK[b.priority] || (a.due ?? '9999').localeCompare(b.due ?? '9999')),
    [all, filter, q],
  )

  const exportCsv = () =>
    downloadCsv('to-do.csv', ['Task', 'Assigned to', 'Priority', 'Due', 'Status', 'Completed on', 'Notes'], shown.map((t) => [t.title, t.assignee, t.priority, t.due, t.done ? 'Done' : 'To do', t.done_on, t.notes]))

  return (
    <Page
      title="To-do"
      subtitle="Shared tasks for the team."
      actions={<><ExportButton onClick={exportCsv} /><AddButton label="New task" onClick={() => setEditing('new')} /></>}
      toolbar={
        <Toolbar>
          <div className="md:w-72"><SearchField value={q} onChange={setQ} placeholder="Task, person or notes" /></div>
          <Segmented<Filter> value={filter} onChange={setFilter} options={[{ value: 'open', label: 'To do' }, { value: 'done', label: 'Done' }, { value: 'all', label: 'All' }]} className="md:w-64" />
        </Toolbar>
      }
    >
      <StatGrid className="lg:grid-cols-3">
        <Stat label="To do" value={all.filter((t) => !t.done).length} onClick={() => setFilter('open')} />
        <Stat label="Overdue" value={all.filter(overdue).length} tone={all.some(overdue) ? 'red' : undefined} />
        <Stat label="Done" value={all.filter((t) => t.done).length} tone="green" onClick={() => setFilter('done')} className="col-span-2 lg:col-span-1" />
      </StatGrid>

      {isLoading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty
          icon={<ListTodo className="size-7" />}
          title={all.length ? (filter === 'open' ? 'All done' : 'Nothing here') : 'No tasks yet'}
          body={all.length ? undefined : 'Add follow-ups, reorders and reminders for the team.'}
          action={!all.length && <Button onClick={() => setEditing('new')}>New task</Button>}
        />
      ) : (
        <Group>
          {shown.map((t) => (
            <Row
              key={t.id}
              onClick={() => setEditing(t)}
              leading={<DoneToggle todo={t} />}
              title={<span className={cx(t.done && 'text-label-2 line-through')}>{t.title}</span>}
              subtitle={[t.assignee, t.done ? (t.done_on ? `Done ${date(t.done_on)}` : 'Done') : t.due ? `Due ${date(t.due)}` : null, t.notes].filter(Boolean).join(' · ') || undefined}
              trailing={overdue(t) ? <Badge tone="red">Overdue</Badge> : !t.done ? <Badge tone={TONE[t.priority]}>{t.priority}</Badge> : undefined}
            />
          ))}
        </Group>
      )}

      <Editor item={editing} render={(t, open) => <TodoForm todo={t} open={open} onDone={() => setEditing(null)} />} />
    </Page>
  )
}

function DoneToggle({ todo }: { todo: Todo }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    setBusy(true)
    try {
      await put(`todos/${todo.id}`, { ...todo, done: todo.done ? 0 : 1, done_on: null, updated_at: todo.updated_at })
      await qc.invalidateQueries()
      toast(todo.done ? 'Task reopened' : 'Task done')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={todo.done ? `Reopen “${todo.title}”` : `Mark “${todo.title}” done`}
      aria-pressed={todo.done}
      className={cx('pressable grid size-7 shrink-0 place-items-center rounded-full border-2', todo.done ? 'border-green bg-green text-white' : 'border-separator text-transparent hover:border-label-3')}
    >
      <Check className="size-4" strokeWidth={3} />
    </button>
  )
}

function TodoForm({ todo, open, onDone }: { todo: Todo | null; open: boolean; onDone: () => void }) {
  const names = useNames()
  const { data: all } = useList<Todo>('todos')
  const initial = toValues(todo, { title: '', assignee: '', priority: 'Medium', due: '', notes: '', done: '0', done_on: '' })
  const f = useRecordForm({ ...initial, done: todo?.done ? '1' : '0' }, {
    table: 'todos',
    saved: todo ? 'Task updated' : 'Task added',
    onDone,
  })
  const v = f.values
  const assignees = useMemo(
    () => [...new Set([...names.options('people').map((p) => p.name), ...(all ?? []).map((t) => t.assignee ?? '')].filter(Boolean))].sort(),
    [names, all],
  )
  const done = v.done === '1'
  return (
    <Sheet open={open} onClose={onDone} title={todo ? 'Edit task' : 'New task'} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <Field label="Task" required>
          <TextInput value={v.title} onChange={(e) => f.set('title', e.target.value)} placeholder="What needs doing?" autoFocus={!todo} />
        </Field>
        <Segmented value={v.priority} onChange={(x) => f.set('priority', x)} options={[{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
        <FormGrid>
          <Field label="Assigned to">
            <TextInput value={v.assignee} onChange={(e) => f.set('assignee', e.target.value)} list="assignee-list" placeholder="Optional" autoCapitalize="words" />
            <datalist id="assignee-list">{assignees.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          <Field label="Due date">
            <DateInput value={v.due} onChange={(e) => f.set('due', e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Notes">
          <TextArea value={v.notes} onChange={(e) => f.set('notes', e.target.value)} placeholder="Optional" />
        </Field>
        {todo && (
          <Button variant={done ? 'gray' : 'tinted'} size="lg" className="w-full" onClick={() => { f.set('done', done ? '0' : '1'); f.set('done_on', '') }}>
            {done ? 'Mark as not done' : 'Mark as done'}
          </Button>
        )}
        {f.isEdit && <DeleteButton label="Delete task" onClick={() => f.remove('task')} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}
