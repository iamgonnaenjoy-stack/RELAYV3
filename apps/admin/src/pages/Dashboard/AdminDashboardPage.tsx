import { FormEvent, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Copy,
  Hash,
  KeyRound,
  LogOut,
  Radio,
  Save,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import ChannelRow from '@/components/dashboard/ChannelRow'
import MemberRow from '@/components/dashboard/MemberRow'
import { adminApi } from '@/lib/services'
import { AdminChannel, AdminMember, AdminOverview, RelayServer } from '@/lib/types'
import { useAdminAuthStore } from '@/stores/admin-auth.store'

function relativeDate(value: string | null) {
  if (!value) return 'Never'
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

function normalizeMember(member: AdminMember): AdminMember {
  return {
    ...member,
    _count: {
      messages: member._count?.messages ?? 0,
    },
  }
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
      setUsers(usersResponse.data.map(normalizeMember))
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
      setUsers((current) => [normalizeMember(response.data.user), ...current])
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
        current.map((member) =>
          member.id === userId ? normalizeMember(response.data.user) : member
        )
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
      <div className="flex h-full items-center justify-center bg-black">
        <div className="flex items-center gap-3 px-5 py-4 text-sm text-text-secondary">
          <div className="h-3 w-3 animate-pulse rounded-full bg-accent" />
          Loading admin workspace...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-black text-white">
      <aside className="hidden w-[248px] shrink-0 border-r border-border-soft bg-[#030405] lg:flex lg:flex-col">
        <div className="border-b border-border-soft px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-control bg-bg-elevated text-accent">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-secondary">
                Relay Admin
              </p>
              <p className="mt-1 text-base font-semibold tracking-[-0.03em] text-white">
                {server?.name ?? 'Relay'}
              </p>
            </div>
          </div>
        </div>

        <nav className="border-b border-border-soft px-3 py-4">
          <a
            href="#server"
            className="flex items-center gap-3 rounded-control px-3 py-2 text-sm text-text-secondary transition hover:bg-bg-elevated hover:text-white"
          >
            <Shield size={15} />
            Server
          </a>
          <a
            href="#members"
            className="mt-1 flex items-center gap-3 rounded-control px-3 py-2 text-sm text-text-secondary transition hover:bg-bg-elevated hover:text-white"
          >
            <Users size={15} />
            Members
          </a>
          <a
            href="#channels"
            className="mt-1 flex items-center gap-3 rounded-control px-3 py-2 text-sm text-text-secondary transition hover:bg-bg-elevated hover:text-white"
          >
            <Radio size={15} />
            Channels
          </a>
        </nav>

        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-bg-elevated text-accent">
              <Shield size={14} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{adminUser?.username ?? 'Admin'}</p>
              <p className="text-xs text-text-secondary">Current admin session</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Members</span>
              <span className="font-medium text-white">{stats.members}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Channels</span>
              <span className="font-medium text-white">{stats.channels}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Messages</span>
              <span className="font-medium text-white">{stats.messages}</span>
            </div>
          </div>

          <p className="mt-6 text-xs leading-5 text-text-muted">
            Provision users, update the server identity, and manage channels from one place.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="secondary-button mx-4 mb-4 mt-auto w-auto justify-start gap-2"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </aside>
      <main className="min-w-0 flex-1 bg-[#050607]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-border-soft px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted">
                  Admin workspace
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {server?.name ?? 'Relay'}
                </h1>
                <p className="mt-2 text-sm text-text-secondary">
                  Clean control over server identity, invited users, and live channels.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                <span>{stats.members} members</span>
                <span>{stats.channels} channels</span>
                <span>{stats.messages} messages</span>
                <button onClick={handleLogout} className="secondary-button gap-2 lg:hidden">
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="border-b border-[#2b1518] bg-[#0d0507] px-4 py-3 text-sm text-[#f09596] sm:px-6">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="border-b border-[#183022] bg-[#08100b] px-4 py-3 text-sm text-[#9ed7af] sm:px-6">
              {notice}
            </div>
          ) : null}

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 overflow-y-auto">
              <section id="server" className="border-b border-border-soft px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Server
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Identity and description</h2>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Updated {server ? relativeDate(server.updatedAt) : 'never'}
                  </p>
                </div>

                <form className="mt-5 grid max-w-[760px] gap-4" onSubmit={handleSaveServer}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                        Server key
                      </label>
                      <div className="field flex items-center text-text-secondary">
                        {server?.key ?? 'primary'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Description
                    </label>
                    <textarea
                      className="textarea-field min-h-[104px]"
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

              <section id="members" className="border-b border-border-soft px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Members
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Provisioned users</h2>
                  </div>
                  <p className="text-xs text-text-secondary">{users.length} total</p>
                </div>

                <div className="mt-5 overflow-hidden rounded-control border border-border-soft bg-[#07090c]">
                  {users.length > 0 ? (
                    users.map((member, index) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        isLast={index === users.length - 1}
                        submitting={submitting}
                        onReset={handleResetAccessKey}
                        relativeDate={relativeDate}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-text-secondary">
                      No users yet. Create one from the right column.
                    </div>
                  )}
                </div>
              </section>

              <section id="channels" className="px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Channels
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Text and voice layout</h2>
                  </div>
                  <p className="text-xs text-text-secondary">{channels.length} active</p>
                </div>

                <div className="mt-5 overflow-hidden rounded-control border border-border-soft bg-[#07090c]">
                  {channels.length > 0 ? (
                    channels.map((channel, index) => (
                      <ChannelRow
                        key={channel.id}
                        channel={channel}
                        isLast={index === channels.length - 1}
                        submitting={submitting}
                        onDelete={handleDeleteChannel}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-text-secondary">
                      No channels yet. Create one from the right column.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="min-h-0 overflow-y-auto border-t border-border-soft lg:border-l lg:border-t-0">
              <section className="border-b border-border-soft px-4 py-5 sm:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                  Access provisioning
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">Create invited member</h2>

                <form className="mt-5 grid gap-4" onSubmit={handleCreateUser}>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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

                  <button type="submit" disabled={submitting} className="primary-button w-fit gap-2">
                    <KeyRound size={15} />
                    Generate access key
                  </button>
                </form>
              </section>

              <section className="border-b border-border-soft px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Latest key
                    </p>
                    <p className="mt-2 text-xs text-text-secondary">
                      Copy and share it with the invited member.
                    </p>
                  </div>
                  {lastCreatedKey ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lastCreatedKey)}
                      className="secondary-button h-9 gap-2 px-3"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 rounded-control border border-border-soft bg-black px-3 py-3 font-mono text-xs leading-6 text-white">
                  {lastCreatedKey ?? 'Generate or reset a user key to reveal it here.'}
                </div>
              </section>

              <section className="px-4 py-5 sm:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                  Channel creation
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">Add a live channel</h2>

                <form className="mt-5 grid gap-4" onSubmit={handleCreateChannel}>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
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
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
