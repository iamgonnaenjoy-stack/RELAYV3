import { startTransition, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronDown, Hash, LogOut, Volume2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Channel, useChannelStore } from '@/stores/channel.store'
import { useShellStore } from '@/stores/shell.store'
import { useServerStore } from '@/stores/server.store'
import { useMessageStore } from '@/stores/message.store'
import Skeleton from '@/components/ui/Skeleton'

function ChannelIcon({ type }: { type: Channel['type'] }) {
  if (type === 'VOICE') return <Volume2 size={15} className="flex-shrink-0 opacity-50" />
  return <Hash size={15} className="flex-shrink-0 opacity-50" />
}

export default function ChannelList() {
  const channels = useChannelStore((state) => state.channels)
  const channelsLoading = useChannelStore((state) => state.loading)
  const activeChannelId = useChannelStore((state) => state.activeChannelId)
  const unreadByChannel = useChannelStore((state) => state.unreadByChannel)
  const draftsByChannel = useChannelStore((state) => state.draftsByChannel)
  const resetChannels = useChannelStore((state) => state.resetChannels)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const server = useServerStore((state) => state.server)
  const serverLoading = useServerStore((state) => state.loading)
  const resetServer = useServerStore((state) => state.resetServer)
  const resetMessages = useMessageStore((state) => state.resetMessages)
  const bootstrapError = useShellStore((state) => state.bootstrapError)
  const connectionStatus = useShellStore((state) => state.connectionStatus)
  const resetShell = useShellStore((state) => state.resetShell)
  const navigate = useNavigate()
  const [textOpen, setTextOpen] = useState(true)
  const [voiceOpen, setVoiceOpen] = useState(true)

  const textChannels = useMemo(
    () => channels.filter((channel) => channel.type === 'TEXT'),
    [channels]
  )
  const voiceChannels = useMemo(
    () => channels.filter((channel) => channel.type === 'VOICE'),
    [channels]
  )
  const showChannelSkeletons = channelsLoading && channels.length === 0

  function handleChannelClick(channel: Channel) {
    if (activeChannelId === channel.id) return

    startTransition(() => {
      navigate(`/app/channel/${channel.id}`)
    })
  }

  function handleServerClick() {
    startTransition(() => {
      navigate('/app')
    })
  }

  function handleLogout() {
    resetMessages()
    resetChannels()
    resetServer()
    resetShell()
    clearAuth('signed-out')
    navigate('/')
  }

  const presenceCopy =
    connectionStatus === 'connected'
      ? 'Online'
      : connectionStatus === 'connecting'
        ? 'Connecting...'
        : connectionStatus === 'reconnecting'
          ? 'Reconnecting...'
          : connectionStatus === 'disconnected'
            ? 'Offline'
            : 'Online'

  const presenceDotClass =
    connectionStatus === 'connected'
      ? 'bg-success'
      : connectionStatus === 'disconnected'
        ? 'bg-error'
        : 'bg-warning'

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-divider bg-bg-sidebar">
      <button
        type="button"
        onClick={handleServerClick}
        className="flex h-12 w-full shrink-0 items-center gap-3 border-b border-divider px-4 text-left transition-colors duration-150 hover:bg-bg-hover"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="h-5 w-5 shrink-0 overflow-hidden">
            <img
              src="/relay-logo.png"
              alt="Relay"
              className="block h-5 max-w-none select-none"
              draggable={false}
            />
          </div>
          {serverLoading && !server ? (
            <Skeleton className="h-[14px] w-[112px]" />
          ) : (
            <span className="truncate text-sm font-semibold tracking-[-0.01em] text-text-primary">
              {server?.name ?? 'Relay'}
            </span>
          )}
        </div>
        <ChevronDown size={14} className="text-text-disabled" />
      </button>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <button
          type="button"
          onClick={() => setTextOpen((value) => !value)}
          className="group mb-0.5 flex w-full items-center gap-1 px-2 py-1 text-text-disabled transition-colors duration-150 hover:text-text-secondary"
        >
          <ChevronDown
            size={11}
            className={clsx(
              'shrink-0 transition-transform duration-150',
              textOpen ? 'rotate-0' : '-rotate-90'
            )}
          />
          <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">
            Text Channels
          </span>
        </button>

        {textOpen && showChannelSkeletons && (
          <div className="flex flex-col gap-1.5 px-2 pt-1">
            <Skeleton className="h-8 w-full rounded-[6px]" />
            <Skeleton className="h-8 w-[88%] rounded-[6px]" />
            <Skeleton className="h-8 w-[76%] rounded-[6px]" />
          </div>
        )}

        {textOpen &&
          !showChannelSkeletons &&
          textChannels.map((channel) => {
            const isActive = activeChannelId === channel.id
            const unreadCount = unreadByChannel[channel.id] ?? 0
            const hasDraft = Boolean(draftsByChannel[channel.id]?.trim())
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => handleChannelClick(channel)}
                className={clsx(
                  'mb-0.5 flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-accent-soft text-text-primary'
                    : unreadCount > 0
                      ? 'text-text-primary hover:bg-bg-hover'
                      : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                )}
              >
                <ChannelIcon type={channel.type} />
                <span className="min-w-0 flex-1 truncate">
                  {channel.name}
                </span>
                {!isActive && unreadCount > 0 ? (
                  <span className="rounded-full bg-text-primary px-1.5 py-0.5 text-[10px] font-semibold text-bg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
                {!isActive && unreadCount === 0 && hasDraft ? (
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-disabled">
                    Draft
                  </span>
                ) : null}
              </button>
            )
          })}

        {(voiceChannels.length > 0 || showChannelSkeletons) && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setVoiceOpen((value) => !value)}
              className="mb-0.5 flex w-full items-center gap-1 px-2 py-1 text-text-disabled transition-colors duration-150 hover:text-text-secondary"
            >
              <ChevronDown
                size={11}
                className={clsx(
                  'shrink-0 transition-transform duration-150',
                  voiceOpen ? 'rotate-0' : '-rotate-90'
                )}
              />
              <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">
                Voice Channels
              </span>
            </button>

            {voiceOpen && showChannelSkeletons && (
              <div className="flex flex-col gap-1.5 px-2 pt-1">
                <Skeleton className="h-8 w-[82%] rounded-[6px]" />
                <Skeleton className="h-8 w-[70%] rounded-[6px]" />
              </div>
            )}

            {voiceOpen &&
              !showChannelSkeletons &&
              voiceChannels.map((channel) => {
                const isActive = activeChannelId === channel.id
                const unreadCount = unreadByChannel[channel.id] ?? 0
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleChannelClick(channel)}
                    className={clsx(
                      'mb-0.5 flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-accent-soft text-text-primary'
                        : unreadCount > 0
                          ? 'text-text-primary hover:bg-bg-hover'
                          : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                    )}
                  >
                    <ChannelIcon type={channel.type} />
                    <span className="min-w-0 flex-1 truncate">
                      {channel.name}
                    </span>
                    {!isActive && unreadCount > 0 ? (
                      <span className="rounded-full bg-text-primary px-1.5 py-0.5 text-[10px] font-semibold text-bg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : null}
                  </button>
                )
              })}
          </div>
        )}

        {!channelsLoading && channels.length === 0 && (
          <p className="px-2 py-2.5 text-xs text-text-disabled">
            {bootstrapError ? 'Channels could not be loaded.' : 'No channels are available yet.'}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-divider bg-bg px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-surface">
          <span className="text-xs font-bold uppercase text-text-secondary">
            {user?.username?.[0] ?? '?'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-[1.3] text-text-primary">
            {user?.username}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] leading-[1.3] text-text-disabled">
            <span className={clsx('inline-block h-1.5 w-1.5 rounded-full', presenceDotClass)} />
            {presenceCopy}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-btn text-text-disabled transition-colors duration-150 hover:bg-[rgba(237,66,69,0.1)] hover:text-error"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
