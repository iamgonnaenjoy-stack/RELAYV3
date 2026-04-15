import { Channel } from '@/stores/channel.store'
import { Hash, Volume2 } from 'lucide-react'

interface Props { channel: Channel }

export default function ChatHeader({ channel }: Props) {
  return (
    <header style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, borderBottom: '1px solid #1a1a1a', background: '#000000', flexShrink: 0 }}>
      {channel.type === 'VOICE'
        ? <Volume2 size={18} color="#555" strokeWidth={2} />
        : <Hash size={18} color="#555" strokeWidth={2} />
      }
      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 14 }}>{channel.name}</span>
      {channel.description && (
        <>
          <div style={{ width: 1, height: 16, background: '#222' }} />
          <span style={{ color: '#555', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channel.description}</span>
        </>
      )}
    </header>
  )
}
