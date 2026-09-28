import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ApiError, authApi, type AuthUser } from '@client/lib/api'
import { Button } from '@client/components/ui/Button'
import { Input } from '@client/components/ui/Input'

interface AuthGateProps {
  children: ReactNode
}

type AuthState = 'loading' | 'anonymous' | 'ready' | 'error'

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result =
        mode === 'register'
          ? await authApi.register({ email, password, displayName: displayName || undefined })
          : await authApi.login({ email, password })
      onAuthenticated(result.user)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to reach the server')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-lg font-bold text-white">
          O
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-neutral-900">forge@omix</h1>
        <p className="mt-1 text-center text-sm text-neutral-500">
          {mode === 'register' ? 'Create an account to start building' : 'Sign in to continue building'}
        </p>
        <form className="mt-6 space-y-3" onSubmit={submit}>
          {mode === 'register' && (
            <Input
              id="auth-name"
              label="Name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
            />
          )}
          <Input
            id="auth-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            id="auth-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={mode === 'register' ? 8 : 1}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary hover:underline"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
        >
          {mode === 'register' ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </div>
    </main>
  )
}

export function AuthGate({ children }: AuthGateProps) {
  const [state, setState] = useState<AuthState>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSession = () => {
    setState('loading')
    setError(null)
    void authApi
      .me()
      .then((result) => {
        setUser(result.user)
        setState('ready')
      })
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 401) {
          setUser(null)
          setState('anonymous')
          return
        }
        setError(cause instanceof Error ? cause.message : 'Unable to reach the server')
        setState('error')
      })
  }

  useEffect(loadSession, [])

  if (state === 'loading') {
    return <main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading session…</main>
  }

  if (state === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-neutral-900">Server unavailable</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button className="mt-5" onClick={loadSession}>Retry</Button>
        </div>
      </main>
    )
  }

  if (state === 'anonymous' || !user) return <AuthScreen onAuthenticated={(nextUser) => { setUser(nextUser); setState('ready') }} />

  return <>{children}</>
}
