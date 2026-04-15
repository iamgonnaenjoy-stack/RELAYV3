import { Channel } from '@/stores/channel.store'
import { Hash, Volume2 } from 'lucide-react'

interface Props { channel: Channel }

export default function ChatHeader({ channel }: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-divider bg-bg px-4">
      {channel.type === 'VOICE' ? (
        <Volume2 size={18} className="text-text-disabled" strokeWidth={2} />
      ) : (
        <Hash size={18} className="text-text-disabled" strokeWidth={2} />
      )}
      <span className="truncate text-sm font-semibold text-text-primary">{channel.name}</span>
      {channel.description && (
        <>
          <div className="h-4 w-px bg-border" />
          <span className="truncate text-[13px] text-text-disabled">{channel.description}</span>
        </>
      )}
    </header>
  )
}
