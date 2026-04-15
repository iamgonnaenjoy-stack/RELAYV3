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
    <section className="route-shell flex h-full flex-1 items-center justify-center overflow-y-auto bg-[#0B0C0F] px-6 py-10 sm:px-10">
      <div className="w-full max-w-[760px]">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#1E2230] bg-[#11131A] text-[#5865F2]">
          <Zap size={20} strokeWidth={2.2} />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#626A79]">
          Server Lobby
        </p>

        {serverLoading && !server ? (
          <Skeleton className="mb-4 h-14 w-full max-w-[380px]" />
        ) : (
          <h1 className="mb-4 text-[clamp(40px,8vw,72px)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
            {server?.name ?? 'Relay'}
          </h1>
        )}

        {serverLoading && !server ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full max-w-[540px]" />
            <Skeleton className="h-4 w-full max-w-[440px]" />
          </div>
        ) : (
          <p className="max-w-[620px] text-[15px] leading-7 text-[#7A8190] sm:text-[16px]">
            Choose a channel from the sidebar to join the conversation. Messages stay hidden until
            you actively enter a channel.
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-[150px] rounded-full" />
              <Skeleton className="h-10 w-[162px] rounded-full" />
              <Skeleton className="h-10 w-[134px] rounded-full" />
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1E2230] bg-[#0F1116] px-4 py-2.5 text-sm text-[#D4D8E3]">
                <Hash size={14} className="text-[#5865F2]" />
                <span>{textChannels.length} text channels</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1E2230] bg-[#0F1116] px-4 py-2.5 text-sm text-[#D4D8E3]">
                <Volume2 size={14} className="text-[#5865F2]" />
                <span>{voiceChannels.length} voice channels</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1E2230] bg-[#0F1116] px-4 py-2.5 text-sm text-[#8D95A3]">
                <span>Select a channel to begin</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
