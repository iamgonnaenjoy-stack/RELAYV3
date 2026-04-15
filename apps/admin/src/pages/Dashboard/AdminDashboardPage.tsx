import { FormEvent, useEffect, useState } from 'react'
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
} from 'lucide-react'
import ChannelRow from '@/components/dashboard/ChannelRow'
import MemberRow from '@/components/dashboard/MemberRow'
import { adminApi } from '@/lib/services'
import { AdminChannel, AdminMember, RelayServer } from '@/lib/types'
import { useAdminAuthStore } from '@/stores/admin-auth.store'

type AdminSection = 'server' | 'members' | 'channels'

function relativeDate(value: string | null) {
  if (!value) return 'Never'
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

function sectionFromHash(hash: string): AdminSection {
  const value = hash.replace('#', '')
  if (value === 'members' || value === 'channels') return value
  return 'server'
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
  const [activeSection, setActiveSection] = useState<AdminSection>('server')
  const [server, setServer] = useState<RelayServer | null>(null)
  const [users, setUsers] = useState<AdminMember[]>([])
  const [channels, setChannels] = useState<AdminChannel[]>([])
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [serverForm, setServerForm] = useState({ name: '', description: '' })
  const [userForm, setUserForm] = useState({ username: '', email: '' })
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    type: 'TEXT' as 'TEXT' | 'VOICE',
  })

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [serverResponse, usersResponse, channelsResponse] = await Promise.all([
        adminApi.getServer(),
        adminApi.getUsers(),
        adminApi.getChannels(),
      ])

      setServer(serverResponse.data)
      setServerForm({
        name: serverResponse.data.name,
        description: serverResponse.data.description ?? '',
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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncSection = () => setActiveSection(sectionFromHash(window.location.hash))

    syncSection()
    window.addEventListener('hashchange', syncSection)

    return () => window.removeEventListener('hashchange', syncSection)
  }, [])

  function handleLogout() {
    clearAuth()
    window.location.href = '/'
  }

  function handleSectionChange(section: AdminSection) {
    setActiveSection(section)

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${section}`)
    }
  }

  async function handleSaveServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await adminApi.updateServer({
        name: serverForm.name.trim(),
        description: serverForm.description.trim() || undefined,
      })
      setServer(response.data)
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
      const response = await adminApi.createUser({
        username: userForm.username.trim(),
        email: userForm.email.trim() || undefined,
      })
      setUsers((current) => [normalizeMember(response.data.user), ...current])
      setLastCreatedKey(response.data.accessKey)
      setCopiedKey(false)
      setUserForm({ username: '', email: '' })
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
      setCopiedKey(false)
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
      const response = await adminApi.createChannel({
        name: channelForm.name.trim(),
        description: channelForm.description.trim() || undefined,
        type: channelForm.type,
      })
      setChannels((current) => [...current, response.data].sort((a, b) => a.position - b.position))
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
      setNotice('Channel removed.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to delete channel')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedKey(true)
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
      <aside className="hidden w-[224px] shrink-0 border-r border-border-soft bg-[#030405] lg:flex lg:flex-col">
        <div className="border-b border-border-soft px-4 py-4">
          <div className="flex flex-col gap-3">
            <img
              src="/relay-logo.png"
              alt="Relay"
              className="h-7 w-auto max-w-[126px] select-none"
              draggable={false}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-secondary">
                Admin
              </p>
              <p className="mt-1 text-sm font-semibold tracking-[-0.03em] text-white">
                {server?.name ?? 'Relay'}
              </p>
            </div>
          </div>
        </div>

        <nav className="border-b border-border-soft px-3 py-4">
          <button
            type="button"
            onClick={() => handleSectionChange('server')}
            className={`flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm transition ${
              activeSection === 'server'
                ? 'bg-bg-elevated text-white'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-white'
            }`}
          >
            <Shield size={15} />
            Server
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange('members')}
            className={`mt-1 flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm transition ${
              activeSection === 'members'
                ? 'bg-bg-elevated text-white'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-white'
            }`}
          >
            <Users size={15} />
            Members
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange('channels')}
            className={`mt-1 flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm transition ${
              activeSection === 'channels'
                ? 'bg-bg-elevated text-white'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-white'
            }`}
          >
            <Radio size={15} />
            Channels
          </button>
        </nav>

        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-bg-elevated text-accent">
              <Shield size={14} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{adminUser?.username ?? 'Admin'}</p>
              <p className="text-xs text-text-secondary">Admin session</p>
            </div>
          </div>
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted">
                  {activeSection}
                </p>
                <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                  {activeSection === 'server'
                    ? 'Server'
                    : activeSection === 'members'
                      ? 'Members'
                      : 'Channels'}
                </h1>
              </div>

              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                <span>{users.length} members</span>
                <span>{channels.length} channels</span>
                <button onClick={handleLogout} className="secondary-button gap-2 lg:hidden">
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-border-soft px-4 py-3 sm:px-6 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleSectionChange('server')}
                className={`secondary-button h-9 shrink-0 px-3 ${
                  activeSection === 'server' ? 'border-border text-white' : ''
                }`}
              >
                Server
              </button>
              <button
                type="button"
                onClick={() => handleSectionChange('members')}
                className={`secondary-button h-9 shrink-0 px-3 ${
                  activeSection === 'members' ? 'border-border text-white' : ''
                }`}
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => handleSectionChange('channels')}
                className={`secondary-button h-9 shrink-0 px-3 ${
                  activeSection === 'channels' ? 'border-border text-white' : ''
                }`}
              >
                Channels
              </button>
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

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {activeSection === 'server' ? (
              <section className="max-w-[720px]">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Server
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Settings</h2>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Updated {server ? relativeDate(server.updatedAt) : 'never'}
                  </p>
                </div>

                <form className="mt-6 grid gap-4" onSubmit={handleSaveServer}>
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
                      Description
                    </label>
                    <textarea
                      className="textarea-field min-h-[96px]"
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
            ) : null}

            {activeSection === 'members' ? (
              <section className="max-w-[980px]">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Members
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Create and manage members</h2>
                  </div>
                  <p className="text-xs text-text-secondary">{users.length} total</p>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="rounded-control border border-border-soft bg-[#07090c] p-4">
                    <form className="grid gap-4" onSubmit={handleCreateUser}>
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

                      <button
                        type="submit"
                        disabled={submitting}
                        className="primary-button w-fit gap-2"
                      >
                        <KeyRound size={15} />
                        Create member
                      </button>
                    </form>

                    {lastCreatedKey ? (
                      <div className="mt-5 rounded-control border border-[#184628] bg-[#06110a] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78d79a]">
                            Access key
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(lastCreatedKey)}
                            className="secondary-button h-9 gap-2 border-[#184628] px-3 text-[#78d79a] hover:border-[#27663c] hover:text-[#8ce3aa]"
                          >
                            <Copy size={14} />
                            {copiedKey ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        <div className="mt-3 font-mono text-xs leading-6 text-[#78d79a]">
                          {lastCreatedKey}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="overflow-hidden rounded-control border border-border-soft bg-[#07090c]">
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
                      <div className="px-4 py-6 text-sm text-text-secondary">No users yet.</div>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'channels' ? (
              <section className="max-w-[980px]">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Channels
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Create and manage channels</h2>
                  </div>
                  <p className="text-xs text-text-secondary">{channels.length} active</p>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="rounded-control border border-border-soft bg-[#07090c] p-4">
                    <form className="grid gap-4" onSubmit={handleCreateChannel}>
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
                            setChannelForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          placeholder="What should happen in here?"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="primary-button w-fit gap-2"
                      >
                        <Hash size={15} />
                        Create channel
                      </button>
                    </form>
                  </div>

                  <div className="overflow-hidden rounded-control border border-border-soft bg-[#07090c]">
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
                      <div className="px-4 py-6 text-sm text-text-secondary">No channels yet.</div>
                    )}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
