import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="flex min-h-full items-center justify-center bg-black px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[360px]">
        <input
          className="h-11 w-full rounded-[8px] border border-border bg-bg-elevated px-4 text-sm text-text-primary outline-none transition-all duration-150 placeholder:text-text-muted focus:border-accent focus:shadow-focus"
          type="password"
          value={accessKey}
          onChange={(event) => setAccessKey(event.target.value)}
          placeholder="Enter admin key"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />

        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || accessKey.trim().length === 0}
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-accent px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-bg-soft disabled:text-text-muted"
        >
          {loading ? 'Unlocking...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
