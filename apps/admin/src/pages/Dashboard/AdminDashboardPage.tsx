import { FormEvent, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Copy,
  Hash,
  KeyRound,
  LayoutGrid,
  LogOut,
  Radio,
  Save,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import ChannelRow from '@/components/dashboard/ChannelRow'
import MemberRow from '@/components/dashboard/MemberRow'
import StatCard from '@/components/dashboard/StatCard'
import { adminApi } from '@/lib/services'
import { AdminChannel, AdminMember, AdminOverview, RelayServer } from '@/lib/types'
import { useAdminAuthStore } from '@/stores/admin-auth.store'

function relativeDate(value: string | null) {
  if (!value) return 'Never'
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

export default function AdminDashboardPage() {
  const adminUser = useAdminAuthStore((state) => state.user)
  const clearAuth = useAdminAuthStore((state) => state.clearAuth)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [server, setServer] = useState<RelayServer | null>(null)
  const [users, setUsers] = useState<AdminMember[]>([])
  const [channels, setChannels] = useState<AdminChannel[]>([])
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [serverForm, setServerForm] = useState({ name: '', description: '' })
  const [userForm, setUserForm] = useState({ username: '', email: '', avatar: '' })
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    type: 'TEXT' as 'TEXT' | 'VOICE',
  })

  const stats = useMemo(
    () =>
      overview?.stats ?? {
        members: users.length,
        channels: channels.length,
        messages: 0,
      },
    [channels.length, overview?.stats, users.length]
  )

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [overviewResponse, usersResponse, channelsResponse] = await Promise.all([
        adminApi.overview(),
        adminApi.getUsers(),
        adminApi.getChannels(),
      ])

      setOverview(overviewResponse.data)
      setServer(overviewResponse.data.server)
      setServerForm({
        name: overviewResponse.data.server.name,
        description: overviewResponse.data.server.description ?? '',
      })
      setUsers(usersResponse.data)
      setChannels(channelsResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load admin workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  function handleLogout() {
    clearAuth()
    window.location.href = '/'
  }

  async function handleSaveServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await adminApi.updateServer(serverForm)
      setServer(response.data)
      setOverview((current) => (current ? { ...current, server: response.data } : current))
      setNotice('Server settings saved.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save server settings')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await adminApi.createUser(userForm)
      setUsers((current) => [response.data.user, ...current])
      setLastCreatedKey(response.data.accessKey)
      setOverview((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                members: current.stats.members + 1,
              },
            }
          : current
      )
      setUserForm({ username: '', email: '', avatar: '' })
      setNotice(`Access key generated for ${response.data.user.username}.`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to create member')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetAccessKey(userId: string) {
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await adminApi.resetUserAccessKey(userId)
      setUsers((current) =>
        current.map((member) => (member.id === userId ? response.data.user : member))
      )
      setLastCreatedKey(response.data.accessKey)
      setNotice(`Fresh access key generated for ${response.data.user.username}.`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to regenerate access key')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await adminApi.createChannel(channelForm)
      setChannels((current) => [...current, response.data].sort((a, b) => a.position - b.position))
      setOverview((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                channels: current.stats.channels + 1,
              },
            }
          : current
      )
      setChannelForm({ name: '', description: '', type: 'TEXT' })
      setNotice(`Channel #${response.data.name} created.`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to create channel')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteChannel(channelId: string) {
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      await adminApi.deleteChannel(channelId)
      setChannels((current) => current.filter((channel) => channel.id !== channelId))
      setOverview((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                channels: Math.max(0, current.stats.channels - 1),
              },
            }
          : current
      )
      setNotice('Channel removed.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to delete channel')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value)
    setNotice('Copied to clipboard.')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="panel flex items-center gap-3 px-5 py-4 text-sm text-text-secondary">
          <div className="h-3 w-3 animate-pulse rounded-full bg-accent" />
          Loading admin workspace...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-black text-white">
      <aside className="hidden w-[280px] shrink-0 border-r border-border bg-black/70 px-6 py-6 lg:flex lg:flex-col">
        <div className="panel px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent text-white">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-secondary">
                Relay Admin
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">
                {server?.name ?? 'Relay'}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-text-secondary">
            Manage the live single-server structure, provision invited users, and keep the member
            app synced with one source of truth.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <StatCard label="Members" value={stats.members} icon={Users} />
          <StatCard label="Channels" value={stats.channels} icon={LayoutGrid} />
          <StatCard label="Messages" value={stats.messages} icon={Radio} />
        </div>

        <div className="panel mt-6 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
            Admin session
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated">
              <Shield size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{adminUser?.username ?? 'Admin'}</p>
              <p className="text-xs text-text-secondary">Railway secured</p>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="secondary-button mt-auto w-full gap-2">
          <LogOut size={15} />
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-text-secondary">
                Control Center
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Admin website for the live Relay system.
              </h1>
              <p className="mt-3 max-w-[760px] text-sm leading-6 text-text-secondary sm:text-base">
                Members log in with generated access keys. Server identity and channels are created
                here and reflected in the client app.
              </p>
            </div>

            <button onClick={handleLogout} className="secondary-button gap-2 lg:hidden">
              <LogOut size={15} />
              Sign out
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-control border border-[#452125] bg-[#150b0d] px-4 py-3 text-sm text-[#f09596]">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="mb-4 rounded-control border border-[#1b3425] bg-[#09150f] px-4 py-3 text-sm text-[#9ed7af]">
              {notice}
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="panel p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
                    Server
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    Single-server identity
                  </h2>
                </div>
                <div className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-secondary">
                  Live
                </div>
              </div>

              <form className="mt-6 grid gap-4" onSubmit={handleSaveServer}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Server name
                    </label>
                    <input
                      className="field"
                      value={serverForm.name}
                      onChange={(event) =>
                        setServerForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Relay"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Updated
                    </label>
                    <div className="field flex items-center text-text-secondary">
                      {server ? relativeDate(server.updatedAt) : 'Not available'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                    Description
                  </label>
                  <textarea
                    className="textarea-field min-h-[120px]"
                    value={serverForm.description}
                    onChange={(event) =>
                      setServerForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Describe what this server is for."
                  />
                </div>

                <button type="submit" disabled={submitting} className="primary-button w-fit gap-2">
                  <Save size={15} />
                  Save server
                </button>
              </form>
            </section>

            <section className="panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
                Access provisioning
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Create invited members
              </h2>

              <form className="mt-6 grid gap-4" onSubmit={handleCreateUser}>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                    Username
                  </label>
                  <input
                    className="field"
                    value={userForm.username}
                    onChange={(event) =>
                      setUserForm((current) => ({ ...current, username: event.target.value }))
                    }
                    placeholder="night-runner"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Email
                    </label>
                    <input
                      className="field"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="optional@relay.app"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Avatar URL
                    </label>
                    <input
                      className="field"
                      value={userForm.avatar}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, avatar: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="primary-button w-fit gap-2">
                  <KeyRound size={15} />
                  Generate access key
                </button>
              </form>

              <div className="mt-6 rounded-panel border border-border bg-bg-elevated px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Latest key
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-white">
                      {lastCreatedKey ?? 'Generate or reset a user key to reveal it here.'}
                    </p>
                  </div>
                  {lastCreatedKey ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lastCreatedKey)}
                      className="secondary-button h-10 gap-2 px-3"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="panel p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
                    Members
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    Provisioned users
                  </h2>
                </div>
                <div className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-secondary">
                  {users.length} total
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {users.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    submitting={submitting}
                    onReset={handleResetAccessKey}
                    relativeDate={relativeDate}
                  />
                ))}
              </div>
            </section>

            <section className="panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
                Channels
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Text and voice structure
              </h2>

              <form className="mt-6 grid gap-4" onSubmit={handleCreateChannel}>
                <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Channel name
                    </label>
                    <input
                      className="field"
                      value={channelForm.name}
                      onChange={(event) =>
                        setChannelForm((current) => ({
                          ...current,
                          name: event.target.value.toLowerCase().replace(/\s+/g, '-'),
                        }))
                      }
                      placeholder="general"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Type
                    </label>
                    <select
                      className="field"
                      value={channelForm.type}
                      onChange={(event) =>
                        setChannelForm((current) => ({
                          ...current,
                          type: event.target.value as 'TEXT' | 'VOICE',
                        }))
                      }
                    >
                      <option value="TEXT">Text</option>
                      <option value="VOICE">Voice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
                    Description
                  </label>
                  <input
                    className="field"
                    value={channelForm.description}
                    onChange={(event) =>
                      setChannelForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="What should happen in here?"
                  />
                </div>

                <button type="submit" disabled={submitting} className="primary-button w-fit gap-2">
                  <Hash size={15} />
                  Create channel
                </button>
              </form>

              <div className="mt-6 grid gap-3">
                {channels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    submitting={submitting}
                    onDelete={handleDeleteChannel}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
