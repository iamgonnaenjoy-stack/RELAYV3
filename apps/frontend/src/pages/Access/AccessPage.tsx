import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/services'
import { useAuthStore } from '@/stores/auth.store'

export default function AccessPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
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
      const res = await authApi.login({ accessKey: trimmedKey })
      setAuth(res.data.user, res.data.accessToken)
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid access key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[#000000] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[360px]">
        <p className="mb-4 text-center text-sm font-semibold tracking-[0.24em] text-white">
          RELAY V3
        </p>

        <input
          className="h-12 w-full rounded-[10px] border border-[#222222] bg-[#111111] px-4 text-sm text-white outline-none transition-all duration-150 placeholder:text-[#555555] focus:border-[#5865F2]"
          type="text"
          value={accessKey}
          onChange={(event) => setAccessKey(event.target.value)}
          placeholder="Enter access key"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />

        {error && (
          <p className="mt-3 text-sm text-[#ED4245]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || accessKey.trim().length === 0}
          className="mt-3 h-11 w-full rounded-[8px] bg-[#5865F2] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:bg-[#1b1f28] disabled:text-[#5a6170]"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
