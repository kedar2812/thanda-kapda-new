import { Component, lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ApiError, get, post, setAuthLostHandler } from '@/lib/api'
import { SyncProvider, useBoot } from '@/lib/data'
import type { User } from '@/lib/types'
import { MorePage, Shell } from '@/components/Layout'
import { Button, ConfirmProvider, Field, Loading, Notice, TextInput, ToastProvider, spring } from '@/components/ui'
import { applyTheme } from '@/lib/theme'

const Overview = lazy(() => import('@/pages/Overview'))
const Sales = lazy(() => import('@/pages/Sales'))
const Receivables = lazy(() => import('@/pages/Receivables'))
const Stock = lazy(() => import('@/pages/Stock'))
const Money = lazy(() => import('@/pages/Money'))
const Expenses = lazy(() => import('@/pages/Expenses'))
const Amazon = lazy(() => import('@/pages/Amazon'))
const Samples = lazy(() => import('@/pages/Samples'))
const Gst = lazy(() => import('@/pages/Gst'))
const ActivityPage = lazy(() => import('@/pages/Activity'))
const Settings = lazy(() => import('@/pages/Settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: (n, e) => !(e instanceof ApiError) && n < 2, refetchOnWindowFocus: true },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AuthGate />
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

interface Status { needs_setup: boolean; user: User | null }

function AuthGate() {
  const qc = useQueryClient()
  const status = useQuery({ queryKey: ['auth-status'], queryFn: () => get<Status>('auth/status'), staleTime: Infinity })

  useEffect(() => {
    setAuthLostHandler(() => {
      qc.clear()
      qc.invalidateQueries({ queryKey: ['auth-status'] })
    })
  }, [qc])

  if (status.isLoading) return <Splash />
  if (status.isError) return <Splash error={status.error.message} retry={() => status.refetch()} />
  if (status.data?.needs_setup) return <AuthScreen mode="setup" />
  if (!status.data?.user) return <AuthScreen mode="login" />
  return (
    <SyncProvider>
      <Authed />
    </SyncProvider>
  )
}

function Authed() {
  const boot = useBoot()
  useEffect(() => {
    if (boot.data) applyTheme(boot.data.user.theme)
  }, [boot.data])
  if (boot.isLoading) return <Splash />
  if (boot.isError) return <Splash error={boot.error.message} retry={() => boot.refetch()} />
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Lazy><Overview /></Lazy>} />
          <Route path="sales" element={<Lazy><Sales /></Lazy>} />
          <Route path="receivables" element={<Lazy><Receivables /></Lazy>} />
          <Route path="stock" element={<Lazy><Stock /></Lazy>} />
          <Route path="money" element={<Lazy><Money /></Lazy>} />
          <Route path="expenses" element={<Lazy><Expenses /></Lazy>} />
          <Route path="amazon" element={<Lazy><Amazon /></Lazy>} />
          <Route path="samples" element={<Lazy><Samples /></Lazy>} />
          <Route path="gst" element={<Lazy><Gst /></Lazy>} />
          <Route path="activity" element={<Lazy><ActivityPage /></Lazy>} />
          <Route path="settings" element={<Lazy><Settings /></Lazy>} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<Lazy><Overview /></Lazy>} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

/** Keeps one broken screen from blanking the whole app. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-[1.0625rem] font-semibold">This screen hit a problem</p>
        <p className="max-w-sm text-[0.9375rem] text-label-2">Your data is safe. Reload the page to try again.</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    )
  }
}

function Splash({ error, retry }: { error?: string; retry?: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src="/logo-mark.png" alt="Thanda Kapda" className="size-14 rounded-2xl bg-surface object-contain p-2 shadow-card" />
        {error ? (
          <>
            <p className="max-w-xs text-[0.9375rem] text-label-2">{error}</p>
            <Button onClick={retry}>Try again</Button>
          </>
        ) : (
          <Loading />
        )}
      </div>
    </div>
  )
}

function AuthScreen({ mode }: { mode: 'login' | 'setup' }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [setupKey, setSetupKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await post(mode === 'setup' ? 'auth/setup' : 'auth/login', { name, email, password, setup_key: setupKey })
      await qc.invalidateQueries({ queryKey: ['auth-status'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-sm"
        noValidate
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo-mark.png" alt="" className="mb-4 size-16 rounded-[1.1rem] bg-surface object-contain p-2 shadow-card" />
          <h1 className="display text-[1.75rem] font-bold">{mode === 'setup' ? 'Welcome' : 'Thanda Kapda'}</h1>
          <p className="mt-1 text-[0.9375rem] text-label-2">
            {mode === 'setup' ? 'Create the first owner login. You can add partners after.' : 'Sign in to the business dashboard'}
          </p>
        </div>
        <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
          {error && <Notice tone="red">{error}</Notice>}
          {mode === 'setup' && (
            <Field label="Setup code" hint="The one-time code you were given with this dashboard.">
              <TextInput value={setupKey} onChange={(e) => setSetupKey(e.target.value)} autoComplete="off" />
            </Field>
          )}
          {mode === 'setup' && (
            <Field label="Your name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
            </Field>
          )}
          <Field label="Email">
            <TextInput type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus={mode === 'login'} />
          </Field>
          <Field label="Password" hint={mode === 'setup' ? 'At least 8 characters.' : undefined}>
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'setup' ? 'Create login' : 'Sign in'}
          </Button>
        </div>
      </motion.form>
    </div>
  )
}
