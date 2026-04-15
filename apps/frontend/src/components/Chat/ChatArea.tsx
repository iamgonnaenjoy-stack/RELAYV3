import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMessageStore } from '@/stores/message.store'
import { useChannelStore } from '@/stores/channel.store'
import { messageApi } from '@/lib/services'
import { joinChannel, leaveChannel } from '@/lib/socket'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import { Hash } from 'lucide-react'

export default function ChatArea() {
  const { channelId } = useParams<{ channelId: string }>()
  const messages = useMessageStore((s) => s.messages[channelId ?? ''] ?? [])
  const setMessages = useMessageStore((s) => s.setMessages)
  const channels = useChannelStore((s) => s.channels)
  const channel = channels.find((c) => c.id === channelId)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!channelId) return

    joinChannel(channelId)
    setLoading(true)
    messageApi.getByChannel(channelId).then((res) => setMessages(channelId, res.data)).finally(() => setLoading(false))

    return () => {
      leaveChannel(channelId)
    }
  }, [channelId, setMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!channel) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
      <ChatHeader channel={channel} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingTop: 16 }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#444' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #5865F2', borderTopColor: 'transparent', animation: 'spin 700ms linear infinite' }} />
              <span style={{ fontSize: 13 }}>Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={24} color="#444" />
            </div>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 16 }}>Welcome to #{channel.name}</p>
            <p style={{ color: '#555', fontSize: 13 }}>This is the beginning of #{channel.name}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, i) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isGrouped={
                  i > 0 &&
                  messages[i - 1].author.id === msg.author.id &&
                  new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() < 5 * 60 * 1000
                }
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput channelId={channelId!} channelName={channel.name} />
    </div>
  )
}
