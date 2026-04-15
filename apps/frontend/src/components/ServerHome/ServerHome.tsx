import { Zap } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import Shuffle from '@/components/ui/Shuffle'
import { useServerStore } from '@/stores/server.store'

export default function ServerHome() {
  const server = useServerStore((state) => state.server)
  const serverLoading = useServerStore((state) => state.loading)

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
          <Shuffle
            text={server?.name ?? 'Relay'}
            tag="h1"
            className="lobby-heading mb-4 text-[clamp(40px,8vw,72px)]"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover
            respectReducedMotion={true}
            loop={false}
            loopDelay={0}
            scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
          />
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
      </div>
    </section>
  )
}
