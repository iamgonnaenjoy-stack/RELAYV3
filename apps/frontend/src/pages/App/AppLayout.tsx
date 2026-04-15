import { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCcw, WifiOff } from 'lucide-react'
import ChannelList from '@/components/ChannelList/ChannelList'
import ChatArea from '@/components/Chat/ChatArea'
import ServerHome from '@/components/ServerHome/ServerHome'
import { useChannelStore } from '@/stores/channel.store'
import { useShellStore } from '@/stores/shell.store'
import { useServerStore } from '@/stores/server.store'
import { channelApi, serverApi } from '@/lib/services'
import { connectSocket, disconnectSocket } from '@/lib/socket'

function StatusBanner({
  status,
  message,
  showRetry,
  onRetry,
}: {
  status: 'bootstrap-error' | 'connection'
  message: string
  showRetry?: boolean
  onRetry?: () => void
}) {
  const isError = status === 'bootstrap-error'
  const Icon = isError ? AlertTriangle : WifiOff

  return (
    <div className="border-b border-border-divider bg-bg-surface px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-btn border ${
              isError
                ? 'border-[rgba(237,66,69,0.35)] bg-[rgba(237,66,69,0.08)] text-error'
                : 'border-border bg-bg-elevated text-text-muted'
            }`}
          >
            <Icon size={15} />
          </span>
          <p className="truncate text-sm text-text-secondary">{message}</p>
        </div>

        {showRetry && onRetry ? (
          <button type="button" onClick={onRetry} className="btn-ghost shrink-0 px-3 py-1.5 text-xs">
            <RefreshCcw size={13} />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ShellErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="route-shell flex flex-1 items-center justify-center px-6">
      <div className="surface w-full max-w-[420px] p-6 text-center">
        <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-text-muted">
          Relay Sync
        </p>
        <h1 className="mt-3 text-xl font-semibold text-text-primary">
          Server data could not be loaded
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Relay couldn't fetch the current server structure. Retry once the connection is stable.
        </p>
        <button type="button" onClick={onRetry} className="btn-primary mt-5 w-full">
          <RefreshCcw size={14} />
          Retry loading
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const setServer = useServerStore((state) => state.setServer)
  const resetServer = useServerStore((state) => state.resetServer)
  const setServerLoading = useServerStore((state) => state.setLoading)
  const channels = useChannelStore((state) => state.channels)
  const channelLoading = useChannelStore((state) => state.loading)
  const setChannels = useChannelStore((state) => state.setChannels)
  const resetChannels = useChannelStore((state) => state.resetChannels)
  const setChannelLoading = useChannelStore((state) => state.setLoading)
  const setActiveChannel = useChannelStore((state) => state.setActiveChannel)
  const markChannelRead = useChannelStore((state) => state.markChannelRead)
  const bootstrapError = useShellStore((state) => state.bootstrapError)
  const connectionStatus = useShellStore((state) => state.connectionStatus)
  const connectionMessage = useShellStore((state) => state.connectionMessage)
  const setBootstrapError = useShellStore((state) => state.setBootstrapError)
  const resetShell = useShellStore((state) => state.resetShell)
  const location = useLocation()
  const navigate = useNavigate()
  const [reloadKey, setReloadKey] = useState(0)

  const routeChannelId = useMemo(() => {
    const match = location.pathname.match(/\/app\/channel\/([^/]+)/)
    return match?.[1] ?? null
  }, [location.pathname])

  useEffect(() => {
    connectSocket()

    return () => {
      disconnectSocket()
      resetShell()
    }
  }, [resetShell])

  const loadShell = useCallback(() => {
    let active = true
    setBootstrapError(null)
    setServerLoading(true)
    setChannelLoading(true)

    Promise.all([serverApi.getCurrent(), channelApi.getAll()])
      .then(([serverResponse, channelResponse]) => {
        if (!active) return
        setServer(serverResponse.data)
        setChannels(channelResponse.data)
      })
      .catch(() => {
        if (!active) return
        resetServer()
        resetChannels()
        setBootstrapError('Unable to load the server and channel data right now.')
      })
      .finally(() => {
        if (!active) return
        setServerLoading(false)
        setChannelLoading(false)
      })

    return () => {
      active = false
    }
  }, [
    resetChannels,
    resetServer,
    setChannelLoading,
    setChannels,
    setServer,
    setServerLoading,
    setBootstrapError,
  ])

  useEffect(() => loadShell(), [loadShell, reloadKey])

  useEffect(() => {
    setActiveChannel(routeChannelId)
    if (routeChannelId && document.visibilityState === 'visible') {
      markChannelRead(routeChannelId)
    }
  }, [markChannelRead, routeChannelId, setActiveChannel])

  useEffect(() => {
    const syncReadState = () => {
      if (document.visibilityState === 'visible' && routeChannelId) {
        markChannelRead(routeChannelId)
      }
    }

    window.addEventListener('focus', syncReadState)
    document.addEventListener('visibilitychange', syncReadState)

    return () => {
      window.removeEventListener('focus', syncReadState)
      document.removeEventListener('visibilitychange', syncReadState)
    }
  }, [markChannelRead, routeChannelId])

  useEffect(() => {
    if (!routeChannelId || channelLoading) return

    const selectedChannel = channels.find((channel) => channel.id === routeChannelId)

    if (!selectedChannel) {
      navigate('/app', { replace: true })
    }
  }, [channelLoading, channels, navigate, routeChannelId])

  function handleRetryShell() {
    setReloadKey((current) => current + 1)
  }

  const showConnectionBanner =
    connectionStatus === 'connecting' ||
    connectionStatus === 'reconnecting' ||
    connectionStatus === 'disconnected'

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <ChannelList />

      <main className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-chat)]">
        {bootstrapError ? (
          <StatusBanner
            status="bootstrap-error"
            message={bootstrapError}
            showRetry
            onRetry={handleRetryShell}
          />
        ) : null}

        {showConnectionBanner && connectionMessage ? (
          <StatusBanner
            status="connection"
            message={connectionMessage}
            showRetry={connectionStatus === 'disconnected'}
            onRetry={connectionStatus === 'disconnected' ? connectSocket : undefined}
          />
        ) : null}

        {bootstrapError && channels.length === 0 && !channelLoading ? (
          <ShellErrorState onRetry={handleRetryShell} />
        ) : (
          <Routes>
            <Route index element={<ServerHome />} />
            <Route path="channel/:channelId" element={<ChatArea />} />
            <Route path="*" element={<ServerHome />} />
          </Routes>
        )}
      </main>
    </div>
  )
}
