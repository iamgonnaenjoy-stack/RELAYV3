import { Hash, Volume2, Zap } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import { useChannelStore } from '@/stores/channel.store'
import { useServerStore } from '@/stores/server.store'

export default function ServerHome() {
  const server = useServerStore((state) => state.server)
  const serverLoading = useServerStore((state) => state.loading)
  const channels = useChannelStore((state) => state.channels)
  const channelsLoading = useChannelStore((state) => state.loading)

  const textChannels = channels.filter((channel) => channel.type === 'TEXT')
  const voiceChannels = channels.filter((channel) => channel.type === 'VOICE')
  const isLoading = serverLoading || channelsLoading

  return (
    <section className="route-shell lobby-shell flex h-full flex-1 items-center justify-center overflow-y-auto px-6 py-10 sm:px-10">
      <div className="w-full max-w-[760px]">
        <div className="lobby-mark mb-6 inline-flex h-12 w-12 items-center justify-center">
          <Zap size={20} strokeWidth={2.2} />
        </div>

        <p className="lobby-label mb-3">Server Lobby</p>

        {serverLoading && !server ? (
          <Skeleton className="mb-4 h-14 w-full max-w-[380px]" />
        ) : (
          <h1 className="lobby-heading mb-4 text-[clamp(40px,8vw,72px)]">
            {server?.name ?? 'Relay'}
          </h1>
        )}

        {serverLoading && !server ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full max-w-[540px]" />
            <Skeleton className="h-4 w-full max-w-[440px]" />
          </div>
        ) : (
          <p className="lobby-copy max-w-[620px] text-[15px] leading-7 sm:text-[16px]">
            Choose a channel from the sidebar to join the conversation. Messages stay hidden until
            you actively enter a channel.
          </p>
        )}

        <div className="mt-10 flex max-w-[520px] flex-col gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            <>
              <div className="lobby-row">
                <Hash size={14} className="lobby-row-icon" />
                <span>{textChannels.length} text channels available</span>
              </div>
              <div className="lobby-row">
                <Volume2 size={14} className="lobby-row-icon" />
                <span>{voiceChannels.length} voice channels available</span>
              </div>
              <div className="lobby-row">
                <Zap size={14} className="lobby-row-icon" />
                <span>Select a channel to begin</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
