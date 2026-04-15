import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Hash, LogOut, Volume2, Zap } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Channel, useChannelStore } from '@/stores/channel.store'
import { useServerStore } from '@/stores/server.store'
import { joinChannel, leaveChannel } from '@/lib/socket'

function ChannelIcon({ type }: { type: Channel['type'] }) {
  if (type === 'VOICE') return <Volume2 size={15} className="flex-shrink-0 opacity-50" />
  return <Hash size={15} className="flex-shrink-0 opacity-50" />
}

export default function ChannelList() {
  const channels = useChannelStore((state) => state.channels)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const server = useServerStore((state) => state.server)
  const location = useLocation()
  const navigate = useNavigate()
  const [textOpen, setTextOpen] = useState(true)
  const [voiceOpen, setVoiceOpen] = useState(true)

  const activeChannelId = location.pathname.match(/\/app\/channel\/([^/]+)/)?.[1] ?? null
  const textChannels = channels.filter((channel) => channel.type === 'TEXT')
  const voiceChannels = channels.filter((channel) => channel.type === 'VOICE')

  function handleChannelClick(channel: Channel) {
    if (activeChannelId && activeChannelId !== channel.id) leaveChannel(activeChannelId)
    joinChannel(channel.id)
    navigate(`/app/channel/${channel.id}`)
  }

  function handleLogout() {
    clearAuth()
    navigate('/')
  }

  return (
    <aside
      style={{
        width: 240,
        background: '#080808',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: '#5865F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={11} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {server?.name ?? 'Relay'}
          </span>
        </div>
        <ChevronDown size={14} color="#555" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        <button
          onClick={() => setTextOpen((value) => !value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            width: '100%',
            padding: '4px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#555',
            marginBottom: 2,
          }}
          className="group hover:text-[#888] transition-colors duration-150"
        >
          <ChevronDown
            size={11}
            style={{
              transform: textOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 150ms',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              flex: 1,
              textAlign: 'left',
            }}
          >
            Text Channels
          </span>
        </button>

        {textOpen &&
          textChannels.map((channel) => {
            const isActive = activeChannelId === channel.id
            return (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 8px',
                  marginBottom: 1,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(88,101,242,0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : '#666666',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(event) => {
                  if (!isActive) {
                    event.currentTarget.style.background = '#111111'
                    event.currentTarget.style.color = '#aaaaaa'
                  }
                }}
                onMouseLeave={(event) => {
                  if (!isActive) {
                    event.currentTarget.style.background = 'transparent'
                    event.currentTarget.style.color = '#666666'
                  }
                }}
              >
                <ChannelIcon type={channel.type} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {channel.name}
                </span>
              </button>
            )
          })}

        {voiceChannels.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setVoiceOpen((value) => !value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                padding: '4px 8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
                marginBottom: 2,
              }}
            >
              <ChevronDown
                size={11}
                style={{
                  transform: voiceOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  flex: 1,
                  textAlign: 'left',
                }}
              >
                Voice Channels
              </span>
            </button>

            {voiceOpen &&
              voiceChannels.map((channel) => {
                const isActive = activeChannelId === channel.id
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      marginBottom: 1,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(88,101,242,0.15)' : 'transparent',
                      color: isActive ? '#ffffff' : '#666666',
                      fontSize: 14,
                      fontWeight: 500,
                      textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.background = '#111111'
                        event.currentTarget.style.color = '#aaaaaa'
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.background = 'transparent'
                        event.currentTarget.style.color = '#666666'
                      }
                    }}
                  >
                    <ChannelIcon type={channel.type} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {channel.name}
                    </span>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderTop: '1px solid #1a1a1a',
          background: '#000000',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#111111',
            border: '1px solid #222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#888', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
            {user?.username?.[0] ?? '?'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {user?.username}
          </p>
          <p style={{ color: '#444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3BA55D', display: 'inline-block' }} />
            Online
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 150ms',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = '#ED4245'
            event.currentTarget.style.background = 'rgba(237,66,69,0.1)'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = '#555'
            event.currentTarget.style.background = 'none'
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
