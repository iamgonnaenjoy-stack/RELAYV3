import { useEffect, useMemo } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import ChannelList from '@/components/ChannelList/ChannelList'
import ChatArea from '@/components/Chat/ChatArea'
import ServerHome from '@/components/ServerHome/ServerHome'
import { useChannelStore } from '@/stores/channel.store'
import { useServerStore } from '@/stores/server.store'
import { channelApi, serverApi } from '@/lib/services'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export default function AppLayout() {
  const setServer = useServerStore((state) => state.setServer)
  const resetServer = useServerStore((state) => state.resetServer)
  const setServerLoading = useServerStore((state) => state.setLoading)
  const channels = useChannelStore((state) => state.channels)
  const channelLoading = useChannelStore((state) => state.loading)
  const setChannels = useChannelStore((state) => state.setChannels)
  const resetChannels = useChannelStore((state) => state.resetChannels)
  const setChannelLoading = useChannelStore((state) => state.setLoading)
  const location = useLocation()
  const navigate = useNavigate()

  const routeChannelId = useMemo(() => {
    const match = location.pathname.match(/\/app\/channel\/([^/]+)/)
    return match?.[1] ?? null
  }, [location.pathname])

  useEffect(() => {
    connectSocket()

    return () => {
      disconnectSocket()
    }
  }, [])

  useEffect(() => {
    let active = true
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
  ])

  useEffect(() => {
    if (!routeChannelId || channelLoading) return

    const selectedChannel = channels.find((channel) => channel.id === routeChannelId)

    if (!selectedChannel) {
      navigate('/app', { replace: true })
    }
  }, [channelLoading, channels, navigate, routeChannelId])

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#000000]">
      <ChannelList />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#0B0C0F]">
        <Routes>
          <Route index element={<ServerHome />} />
          <Route path="channel/:channelId" element={<ChatArea />} />
          <Route path="*" element={<ServerHome />} />
        </Routes>
      </main>
    </div>
  )
}
