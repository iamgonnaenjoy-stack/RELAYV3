import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Sparkles } from 'lucide-react'
import { adminApi } from '@/lib/services'
import { useAdminAuthStore } from '@/stores/admin-auth.store'

export default function AdminAccessPage() {
  const navigate = useNavigate()
  const setAuth = useAdminAuthStore((state) => state.setAuth)
  const [accessKey, setAccessKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedKey = accessKey.trim()
    if (!trimmedKey) return

    setError('')
    setLoading(true)

    try {
      const response = await adminApi.login({ accessKey: trimmedKey })
      setAuth(response.data.user, response.data.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to unlock admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6">
      <div className="panel grid w-full max-w-[1040px] overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative border-b border-border px-8 py-12 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,101,242,0.18),transparent_45%)]" />
          <div className="relative">
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-[14px] border border-accent/30 bg-accent/10 text-accent">
              <Shield size={22} />
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.34em] text-text-secondary">
              Relay Control
            </p>
            <h1 className="max-w-[420px] text-4xl font-semibold tracking-[-0.04em] text-white lg:text-5xl">
              Admin command for users, channels, and server structure.
            </h1>
            <p className="mt-6 max-w-[460px] text-base leading-7 text-text-secondary">
              Provision access keys, tune the single-server layout, and keep the member app clean.
              Same visual language, admin-only surface.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 py-2 text-xs uppercase tracking-[0.22em] text-text-secondary">
              <Sparkles size={14} className="text-accent" />
              Railway ready
            </div>
          </div>
        </div>

        <div className="bg-black px-8 py-12 lg:px-12 lg:py-16">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-text-secondary">
            Admin Access
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
              Admin key
            </label>
            <input
              className="field"
              type="password"
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              placeholder="Enter your admin key"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || accessKey.trim().length === 0}
              className="primary-button w-full"
            >
              {loading ? 'Unlocking...' : 'Enter Admin'}
            </button>
          </form>

          <div className="mt-8 rounded-panel border border-border bg-bg-panel px-4 py-4 text-sm text-text-secondary">
            This panel authenticates against the backend with the
            <span className="mx-1 font-mono text-[12px] text-text-primary">ADMIN_ACCESS_KEY</span>
            secret.
          </div>
        </div>
      </div>
    </div>
  )
}
