import {
  CSSProperties,
  ElementType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export interface ShuffleProps {
  text: string
  className?: string
  style?: CSSProperties
  shuffleDirection?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  maxDelay?: number
  ease?: string | ((t: number) => number)
  threshold?: number
  rootMargin?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  textAlign?: CSSProperties['textAlign']
  onShuffleComplete?: () => void
  shuffleTimes?: number
  animationMode?: 'random' | 'evenodd'
  loop?: boolean
  loopDelay?: number
  stagger?: number
  scrambleCharset?: string
  colorFrom?: string
  colorTo?: string
  triggerOnce?: boolean
  respectReducedMotion?: boolean
  triggerOnHover?: boolean
}

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function getOffset(direction: NonNullable<ShuffleProps['shuffleDirection']>) {
  switch (direction) {
    case 'left':
      return { xPercent: -100, yPercent: 0 }
    case 'up':
      return { xPercent: 0, yPercent: -120 }
    case 'down':
      return { xPercent: 0, yPercent: 120 }
    case 'right':
    default:
      return { xPercent: 100, yPercent: 0 }
  }
}

export default function Shuffle({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true,
}: ShuffleProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const hoverHandlerRef = useRef<(() => void) | null>(null)
  const hasPlayedRef = useRef(false)
  const isPlayingRef = useRef(false)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const characters = useMemo(() => Array.from(text), [text])
  const Tag = tag as ElementType

  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') {
        setFontsLoaded(true)
      } else {
        document.fonts.ready.then(() => setFontsLoaded(true))
      }
      return
    }

    setFontsLoaded(true)
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !text || !fontsLoaded) return

      const reducedMotion =
        respectReducedMotion &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const clearHover = () => {
        if (hoverHandlerRef.current && root) {
          root.removeEventListener('mouseenter', hoverHandlerRef.current)
          hoverHandlerRef.current = null
        }
      }

      const cleanupTimeline = () => {
        timelineRef.current?.kill()
        timelineRef.current = null
        isPlayingRef.current = false
      }

      const setFinalState = () => {
        charRefs.current.forEach((charRef, index) => {
          if (!charRef) return
          const finalCharacter = characters[index] === ' ' ? '\u00A0' : characters[index]
          charRef.textContent = finalCharacter
          gsap.set(charRef, {
            clearProps: 'xPercent,yPercent,opacity,color,filter',
          })
        })
      }

      if (reducedMotion) {
        setFinalState()
        return () => {
          clearHover()
          cleanupTimeline()
        }
      }

      const buildSequence = (finalCharacter: string) => {
        if (finalCharacter === ' ') {
          return ['\u00A0']
        }

        const source = scrambleCharset || DEFAULT_CHARSET
        const runs = Math.max(1, Math.floor(shuffleTimes))

        if (!source.length) {
          return Array.from({ length: runs }, () => finalCharacter)
        }

        return Array.from({ length: runs }, () => {
          const next = source.charAt(Math.floor(Math.random() * source.length))
          return next || finalCharacter
        })
      }

      const getDelay = (index: number) => {
        if (animationMode === 'random') {
          return Math.random() * maxDelay
        }

        const groupIndex = Math.floor(index / 2)
        const groupOffset = index % 2 === 0 ? 0 : stagger
        return groupIndex * stagger + groupOffset
      }

      const play = () => {
        const targets = charRefs.current.filter(Boolean) as HTMLSpanElement[]
        if (!targets.length) return

        clearHover()
        cleanupTimeline()
        isPlayingRef.current = true

        const timeline = gsap.timeline({
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onRepeat: () => {
            hasPlayedRef.current = true
            onShuffleComplete?.()
          },
          onComplete: () => {
            isPlayingRef.current = false
            hasPlayedRef.current = true
            setFinalState()
            onShuffleComplete?.()

            if (triggerOnHover && !loop && root) {
              const hoverHandler = () => {
                if (isPlayingRef.current) return
                play()
              }

              hoverHandlerRef.current = hoverHandler
              root.addEventListener('mouseenter', hoverHandler)
            }
          },
        })

        const { xPercent, yPercent } = getOffset(shuffleDirection)
        const stepDuration = duration / Math.max(1, shuffleTimes + 1)

        targets.forEach((target, index) => {
          const finalCharacter = characters[index]
          if (!finalCharacter) return

          const displayCharacter = finalCharacter === ' ' ? '\u00A0' : finalCharacter
          const sequence = buildSequence(finalCharacter)
          const delay = getDelay(index)

          target.textContent = sequence[0] ?? displayCharacter

          const fromState: gsap.TweenVars = {
            xPercent,
            yPercent,
            opacity: 0,
            filter: 'blur(4px)',
          }

          if (colorFrom) {
            fromState.color = colorFrom
          }

          const toState: gsap.TweenVars = {
            xPercent: 0,
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration,
            ease,
          }

          if (colorTo) {
            toState.color = colorTo
          }

          timeline.fromTo(target, fromState, toState, delay)

          sequence.forEach((character, sequenceIndex) => {
            timeline.call(
              () => {
                target.textContent = character === ' ' ? '\u00A0' : character
              },
              undefined,
              delay + stepDuration * sequenceIndex
            )
          })

          timeline.call(
            () => {
              target.textContent = displayCharacter
            },
            undefined,
            delay + duration
          )
        })

        timelineRef.current = timeline
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (!entry?.isIntersecting) return

          if (triggerOnce && hasPlayedRef.current) return

          play()

          if (triggerOnce) {
            observer.disconnect()
          }
        },
        {
          root: null,
          threshold,
          rootMargin,
        }
      )

      observer.observe(root)

      return () => {
        observer.disconnect()
        clearHover()
        cleanupTimeline()
      }
    },
    {
      dependencies: [
        animationMode,
        characters,
        colorFrom,
        colorTo,
        duration,
        ease,
        fontsLoaded,
        loop,
        loopDelay,
        maxDelay,
        onShuffleComplete,
        respectReducedMotion,
        rootMargin,
        scrambleCharset,
        shuffleDirection,
        shuffleTimes,
        stagger,
        text,
        threshold,
        triggerOnHover,
        triggerOnce,
      ],
      scope: rootRef,
    }
  )

  return (
    <Tag
      ref={rootRef}
      aria-label={text}
      className={className}
      style={{
        textAlign,
        ...style,
      }}
    >
      {characters.map((character, index) => {
        const content = character === ' ' ? '\u00A0' : character

        return (
          <span
            key={`${character}-${index}`}
            aria-hidden="true"
            className="inline-block whitespace-pre will-change-transform"
            ref={(node) => {
              charRefs.current[index] = node
            }}
          >
            {content}
          </span>
        )
      })}
    </Tag>
  )
}
