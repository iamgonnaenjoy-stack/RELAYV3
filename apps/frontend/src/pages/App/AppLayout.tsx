import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ChannelList from '@/components/ChannelList/ChannelList'
import ChatArea from '@/components/Chat/ChatArea'
import { useChannelStore } from '@/stores/channel.store'
import { useServerStore } from '@/stores/server.store'
import { channelApi, serverApi } from '@/lib/services'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export default function AppLayout() {
  const setServer = useServerStore((state) => state.setServer)
  const setChannels = useChannelStore((state) => state.setChannels)
  const activeChannelId = useChannelStore((state) => state.activeChannelId)
  const setActiveChannel = useChannelStore((state) => state.setActiveChannel)
  const navigate = useNavigate()

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

        const firstTextChannel = channelResponse.data.find((channel) => channel.type === 'TEXT')
        if (firstTextChannel && !activeChannelId) {
          setActiveChannel(firstTextChannel.id)
          navigate(`/app/channel/${firstTextChannel.id}`, { replace: true })
        }
      })
      .catch(() => {
        setChannels([])
      })
  }, [activeChannelId, navigate, setActiveChannel, setChannels, setServer])

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
