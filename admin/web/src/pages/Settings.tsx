import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Boxes, Download, MapPin, Moon, RotateCcw, Tags, Upload, UserRound, Wallet, type LucideIcon } from 'lucide-react'
import { Page } from '@/components/Layout'
import { Sheet } from '@/components/Sheet'
import { DeleteButton, Editor, FormError, downloadBlob } from '@/components/common'
import { Badge, Button, Field, Group, Notice, NumberInput, Row, Segmented, Select, TextInput, cx, useConfirm, useToast } from '@/components/ui'
import { ApiError, del, get, post, put } from '@/lib/api'
import { useBoot, useNames } from '@/lib/data'
import { qty, todayISO } from '@/lib/format'
import { toValues, useRecordForm } from '@/lib/form'
import { applyTheme, type ThemePref } from '@/lib/theme'
import type { Master, MasterTable } from '@/lib/types'

const LISTS: { table: MasterTable; title: string; one: string; icon: LucideIcon; hint: string }[] = [
  { table: 'designs', title: 'Designs', one: 'design', icon: Boxes, hint: 'Print and packaging variants' },
  { table: 'locations', title: 'Locations', one: 'location', icon: MapPin, hint: 'Where stock is kept' },
  { table: 'accounts', title: 'Money accounts', one: 'account', icon: Wallet, hint: 'Bank, personal accounts and cash' },
  { table: 'categories', title: 'Expense categories', one: 'category', icon: Tags, hint: 'How spending is grouped' },
  { table: 'people', title: 'People', one: 'person', icon: UserRound, hint: 'Partners and staff for “handled by”, “paid by”' },
]

interface TeamUser { id: number; name: string; email: string; role: 'owner' | 'staff'; active: boolean }

export default function Settings() {
  const { data: boot } = useBoot()
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [list, setList] = useState<(typeof LISTS)[number] | null>(null)
  const [theme, setTheme] = useState<ThemePref>(boot?.user.theme ?? 'system')
  const fileInput = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)
  const isOwner = boot?.user.role === 'owner'

  const changeTheme = (t: ThemePref) => {
    setTheme(t)
    applyTheme(t)
    put('me', { theme: t }).then(() => qc.invalidateQueries({ queryKey: ['bootstrap'] })).catch(() => {})
  }

  async function backup() {
    try {
      const data = await get('backup')
      downloadBlob(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), `thanda-kapda-backup-${todayISO()}.json`)
      toast('Backup downloaded')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Backup failed', 'error')
    }
  }

  async function restore(file: File) {
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      return toast('That file is not a backup', 'error')
    }
    const yes = await confirm({
      title: 'Replace all current data?',
      body: 'Everything in the dashboard will be replaced with this backup. Logins are kept. Download a fresh backup first if you’re unsure.',
      confirm: 'Replace',
      destructive: true,
    })
    if (!yes) return
    setRestoring(true)
    try {
      await post('restore', data)
      await qc.invalidateQueries()
      toast('Backup restored')
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Restore failed', 'error')
    } finally {
      setRestoring(false)
    }
  }

  async function signOut() {
    await post('auth/logout').catch(() => {})
    qc.clear()
    window.location.href = '/'
  }

  return (
    <Page title="Settings">
      <div className="grid gap-x-6 lg:grid-cols-2">
        <div>
          <Group title="Lists" footer="Renaming keeps all history. Items already used are archived instead of deleted.">
            {LISTS.map((l) => (
              <ListRow key={l.table} list={l} onClick={() => setList(l)} />
            ))}
          </Group>
          <Group title="Appearance">
            <div className="flex items-center gap-3 px-4 py-3">
              <Moon className="size-5 text-label-2" />
              <span className="flex-1 text-[0.9375rem]">Theme</span>
              <Segmented<ThemePref> value={theme} onChange={changeTheme} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Auto' }]} className="w-56" />
            </div>
          </Group>
        </div>
        <div>
          <Team isOwner={isOwner} myId={boot?.user.id} />
          <Group title="Backup" footer="A backup is one file with every record. Keep one somewhere safe each month.">
            <Row leading={<Download className="size-5 text-accent" />} title="Download full backup" onClick={backup} chevron={false} />
            {isOwner && (
              <Row leading={<Upload className="size-5 text-red" />} title={restoring ? 'Restoring…' : 'Restore from a backup'} subtitle="Replaces all current data" onClick={() => fileInput.current?.click()} chevron={false} />
            )}
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => { if (e.target.files?.[0]) restore(e.target.files[0]); e.target.value = '' }} />
          </Group>
          <Group>
            <Row title={<span className="text-red">Sign out</span>} subtitle={boot?.user.email} onClick={signOut} chevron={false} />
          </Group>
        </div>
      </div>
      <ListSheet list={list} onClose={() => setList(null)} />
    </Page>
  )
}

function ListRow({ list, onClick }: { list: (typeof LISTS)[number]; onClick: () => void }) {
  const names = useNames()
  const active = names.masters[list.table].filter((m) => !m.archived).length
  return (
    <Row
      onClick={onClick}
      leading={<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-on-accent"><list.icon className="size-[1.125rem]" /></span>}
      title={list.title}
      subtitle={list.hint}
      trailing={<span className="text-label-2">{active}</span>}
    />
  )
}

// ---------------------------------------------------------------- master lists

function ListSheet({ list, onClose }: { list: (typeof LISTS)[number] | null; onClose: () => void }) {
  const [last, setLast] = useState(list)
  if (list && list !== last) setLast(list)
  const l = list ?? last
  const names = useNames()
  const [editing, setEditing] = useState<Master | 'new' | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  if (!l) return null
  const items = names.masters[l.table]
  const active = items.filter((m) => !m.archived)
  const archived = items.filter((m) => m.archived)

  return (
    <>
      <Sheet open={list !== null} onClose={onClose} title={l.title}>
        <div className="pt-1">
          <Button size="lg" variant="tinted" className="mb-5 w-full" onClick={() => setEditing('new')}>Add {l.one}</Button>
          <Group>
            {active.map((m) => (
              <Row key={m.id} title={m.name} onClick={() => setEditing(m)} trailing={l.table === 'designs' && m.low_stock != null ? <span className="text-[0.8125rem] text-label-2">warn at {qty(m.low_stock)}</span> : undefined} />
            ))}
          </Group>
          {archived.length > 0 && (
            <>
              <button type="button" className="mb-2 px-4 text-[0.875rem] font-medium text-accent" onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
              </button>
              {showArchived && (
                <Group footer="Archived items are hidden from dropdowns but kept in history.">
                  {archived.map((m) => <ArchivedRow key={m.id} table={l.table} item={m} />)}
                </Group>
              )}
            </>
          )}
        </div>
      </Sheet>
      <Editor item={editing} render={(m, open) => <MasterForm table={l.table} one={l.one} item={m} open={open} onDone={() => setEditing(null)} />} />
    </>
  )
}

function ArchivedRow({ table, item }: { table: MasterTable; item: Master }) {
  const qc = useQueryClient()
  const toast = useToast()
  return (
    <Row
      leading={<Archive className="size-4 text-label-3" />}
      title={item.name}
      tone="muted"
      trailing={
        <button
          type="button"
          className="pressable inline-flex items-center gap-1 text-[0.875rem] font-medium text-accent"
          onClick={async () => {
            await post(`${table}/${item.id}/restore`)
            await qc.invalidateQueries()
            toast(`${item.name} restored`)
          }}
        >
          <RotateCcw className="size-3.5" /> Restore
        </button>
      }
    />
  )
}

function MasterForm({ table, one, item, open, onDone }: { table: MasterTable; one: string; item: Master | null; open: boolean; onDone: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const f = useRecordForm(toValues(item, { name: '', sort: '999', low_stock: '' }), { table, saved: item ? 'Renamed' : 'Added', onDone })
  const v = f.values

  async function remove() {
    const yes = await confirm({ title: `Remove “${item?.name}”?`, body: 'If it’s used in any record it will be archived instead, so history stays intact.', confirm: 'Remove', destructive: true })
    if (!yes || !item) return
    try {
      const res = await del<{ archived?: boolean }>(`${table}/${item.id}`)
      await qc.invalidateQueries()
      toast(res.archived ? `${item.name} archived — it’s used in records` : `${item.name} removed`)
      onDone()
    } catch (e) {
      f.setError(e instanceof Error ? e.message : 'Could not remove.')
    }
  }

  return (
    <Sheet open={open} onClose={onDone} title={item ? `Edit ${one}` : `New ${one}`} onSubmit={() => f.save()} busy={f.busy}>
      <div className="space-y-5 pt-1">
        <FormError error={f.error} />
        <Field label="Name" required>
          <TextInput value={v.name} onChange={(e) => f.set('name', e.target.value)} autoFocus />
        </Field>
        {table === 'designs' && (
          <Field label="Low stock warning" hint="Show a warning on the Overview when total stock of this design falls to this number. Leave blank for none.">
            <NumberInput decimal={false} value={v.low_stock} onChange={(x) => f.set('low_stock', x)} placeholder="None" />
          </Field>
        )}
        {item && <DeleteButton label={`Remove ${one}`} onClick={remove} disabled={f.busy} />}
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------- team

function Team({ isOwner, myId }: { isOwner: boolean; myId?: number }) {
  const { data } = useQuery({ queryKey: ['list', 'users'], queryFn: () => get<TeamUser[]>('users') })
  const [editing, setEditing] = useState<TeamUser | 'new' | null>(null)
  return (
    <>
      <Group title="Team logins" action={isOwner && <button type="button" onClick={() => setEditing('new')} className="text-[0.875rem] font-medium text-accent">Add</button>} footer="Each partner gets their own login, so the activity log shows who did what.">
        {(data ?? []).map((u) => (
          <Row
            key={u.id}
            leading={<span className={cx('grid size-8 shrink-0 place-items-center rounded-full text-[0.8125rem] font-semibold', u.active ? 'bg-accent-soft text-accent' : 'bg-fill text-label-3')}>{u.name.slice(0, 1).toUpperCase()}</span>}
            title={<>{u.name}{u.id === myId && <span className="text-label-2"> (you)</span>}</>}
            subtitle={u.email}
            trailing={!u.active ? <Badge>Off</Badge> : u.role === 'staff' ? <Badge tone="gold">Staff</Badge> : <Badge tone="accent">Owner</Badge>}
            onClick={isOwner ? () => setEditing(u) : undefined}
          />
        ))}
      </Group>
      <Editor item={editing} render={(u, open) => <UserForm user={u} open={open} myId={myId} onDone={() => setEditing(null)} />} />
    </>
  )
}

function UserForm({ user, open, myId, onDone }: { user: TeamUser | null; open: boolean; myId?: number; onDone: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [v, setV] = useState({ name: user?.name ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'owner', active: user?.active ?? true })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      if (user) await put(`users/${user.id}`, { name: v.name, password: v.password || undefined, active: v.active })
      else await post('users', v)
      await qc.invalidateQueries()
      toast(user ? 'Login updated' : 'Login created')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onDone} title={user ? 'Edit login' : 'New login'} onSubmit={save} busy={busy}>
      <div className="space-y-5 pt-1">
        <FormError error={error} />
        <Field label="Name" required><TextInput value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="Email" required><TextInput type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} disabled={!!user} /></Field>
        <Field label={user ? 'New password' : 'Password'} required={!user} hint={user ? 'Leave blank to keep the current password.' : 'At least 8 characters. Share it with them privately.'}>
          <TextInput type="password" autoComplete="new-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
        </Field>
        {!user && (
          <Field label="Access" hint="Owners can manage logins and restore backups. Everyone can enter and edit records.">
            <Select value={v.role} onChange={(x) => setV({ ...v, role: (x || 'owner') as 'owner' | 'staff' })} placeholder="Owner">
              <option value="owner">Owner</option>
              <option value="staff">Staff</option>
            </Select>
          </Field>
        )}
        {user && user.id !== myId && (
          <Notice tone={v.active ? 'accent' : 'orange'}>
            <label className="flex items-center justify-between gap-3">
              <span>{v.active ? 'This login can sign in.' : 'This login is switched off.'}</span>
              <Button size="sm" variant={v.active ? 'destructive' : 'tinted'} onClick={() => setV({ ...v, active: !v.active })}>{v.active ? 'Switch off' : 'Switch on'}</Button>
            </label>
          </Notice>
        )}
      </div>
    </Sheet>
  )
}
