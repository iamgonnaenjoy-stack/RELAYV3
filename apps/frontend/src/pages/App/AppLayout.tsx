import { useEffect, useMemo } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import ChannelList from '@/components/ChannelList/ChannelList'
import ChatArea from '@/components/Chat/ChatArea'
import { useChannelStore } from '@/stores/channel.store'
import { useServerStore } from '@/stores/server.store'
import { channelApi, serverApi } from '@/lib/services'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export default function AppLayout() {
  const setServer = useServerStore((state) => state.setServer)
  const channels = useChannelStore((state) => state.channels)
  const setChannels = useChannelStore((state) => state.setChannels)
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
    Promise.all([serverApi.getCurrent(), channelApi.getAll()])
      .then(([serverResponse, channelResponse]) => {
        setServer(serverResponse.data)
        setChannels(channelResponse.data)
      })
      .catch(() => {
        setChannels([])
      })
  }, [setChannels, setServer])

  useEffect(() => {
    if (channels.length === 0) return

    const selectedChannel = channels.find(
      (channel) => channel.id === routeChannelId && channel.type === 'TEXT'
    )

    if (selectedChannel) return

    const firstTextChannel = channels.find((channel) => channel.type === 'TEXT')
    if (!firstTextChannel) return

    if (routeChannelId !== firstTextChannel.id) {
      navigate(`/app/channel/${firstTextChannel.id}`, { replace: true })
    }
  }, [channels, navigate, routeChannelId])

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#000000]">
      <ChannelList />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#0B0C0F]">
        <Routes>
          <Route path="channel/:channelId" element={<ChatArea />} />
          <Route
            path="*"
            element={
              <div className="flex flex-1 items-center justify-center text-sm text-[#4B5563]">
                No text channel is live yet. Create channels from Relay Admin.
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
