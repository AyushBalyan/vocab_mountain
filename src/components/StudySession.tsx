import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { FlipCard } from './FlipCard'
import type { RecallMark, WordEntry } from '../types'

type StudySessionProps = {
  deck: WordEntry[]
  groupId: number | undefined
  reducedMotion: boolean
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

const SWIPE_MIN_PX = 56

function swipePointerOk(e: React.PointerEvent): boolean {
  return e.pointerType === 'touch' || e.pointerType === 'pen'
}

function CardSwipeWrap({
  enabled,
  onSwipeLeft,
  onSwipeRight,
  children,
}: {
  enabled: boolean
  onSwipeLeft: () => void
  onSwipeRight: () => void
  children: ReactNode
}) {
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  )
  const blockClickRef = useRef(false)

  function onPointerDown(e: React.PointerEvent) {
    if (!enabled || !swipePointerOk(e)) return
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!enabled || !swipePointerOk(e)) return
    if (!startRef.current || e.pointerId !== startRef.current.pointerId) {
      startRef.current = null
      return
    }
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    startRef.current = null

    if (Math.abs(dx) < SWIPE_MIN_PX) return
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return

    blockClickRef.current = true
    window.setTimeout(() => {
      blockClickRef.current = false
    }, 450)

    if (dx < 0) onSwipeLeft()
    else onSwipeRight()

    e.preventDefault()
  }

  function onClickCapture(ev: React.MouseEvent) {
    if (blockClickRef.current) {
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  return (
    <div
      className="w-full max-w-xl [touch-action:pan-y]"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        startRef.current = null
      }}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  )
}

export function StudySession({
  deck,
  groupId,
  reducedMotion,
}: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [phase, setPhase] = useState<'study' | 'complete'>('study')
  const [recallByIndex, setRecallByIndex] = useState<
    Record<number, RecallMark>
  >({})

  const restartDeck = useCallback(() => {
    setPhase('study')
    setIndex(0)
    setFlipped(false)
    setRecallByIndex({})
  }, [])

  const entry = phase === 'study' ? deck[index] : undefined

  const markForgotten = useCallback(() => {
    setRecallByIndex((prev) => ({ ...prev, [index]: 'forgotten' }))
  }, [index])

  const markRemembered = useCallback(() => {
    setRecallByIndex((prev) => ({ ...prev, [index]: 'remembered' }))
  }, [index])

  const swipeGreenAndNext = useCallback(() => {
    setRecallByIndex((prev) => ({ ...prev, [index]: 'remembered' }))
    setFlipped(false)
    if (!deck.length) return
    if (index >= deck.length - 1) setPhase('complete')
    else setIndex((i) => i + 1)
  }, [index, deck.length])

  const swipeLeftMarkRedAndFlip = useCallback(() => {
    setRecallByIndex((prev) => ({ ...prev, [index]: 'forgotten' }))
    setFlipped(true)
  }, [index])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return

      if (phase === 'complete') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          restartDeck()
        }
        return
      }

      const len = deck.length
      if (!len) return

      if (e.ctrlKey || e.metaKey || e.altKey) return

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key

      if (k === 'r') {
        e.preventDefault()
        markForgotten()
        return
      }
      if (k === 'g') {
        e.preventDefault()
        markRemembered()
        return
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setFlipped(false)
        setIndex((i) => {
          if (i >= len - 1) {
            setPhase('complete')
            return i
          }
          return i + 1
        })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setFlipped(false)
        setIndex((i) => (i > 0 ? i - 1 : 0))
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    deck.length,
    phase,
    restartDeck,
    markForgotten,
    markRemembered,
  ])

  function goNext() {
    setFlipped(false)
    if (!deck.length) return
    if (index >= deck.length - 1) setPhase('complete')
    else setIndex((i) => i + 1)
  }

  function goPrev() {
    setFlipped(false)
    setIndex((i) => (i > 0 ? i - 1 : 0))
  }

  function toggleFlip() {
    setFlipped((f) => !f)
  }

  const progress =
    deck.length > 0 ? Math.round(((index + 1) / deck.length) * 100) : 0

  const recallMark = recallByIndex[index]

  if (phase === 'complete') {
    return (
      <div className="flex min-h-[min(280px,55dvh)] w-full max-w-xl flex-col items-center justify-center gap-5 rounded-lg border border-vm-line bg-vm-paper px-8 py-10 text-center shadow-[var(--shadow-card)] animate-vmFade motion-reduce:animate-none">
        <p className="font-display text-3xl font-semibold tracking-tight text-vm-ink">
          Done
        </p>
        <p className="font-body text-vm-muted">
          <span className="tabular-nums text-vm-ink">{deck.length}</span> cards
          {groupId !== undefined ? (
            <>
              {' '}
              · G{groupId}
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={restartDeck}
          className="rounded-full border border-vm-accent bg-vm-accent-soft px-7 py-2.5 font-body text-sm font-medium text-vm-ink transition-colors hover:bg-vm-accent/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent"
        >
          Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between gap-4">
        <span className="font-body tabular-nums text-sm text-vm-muted">
          {deck.length ? index + 1 : 0}/{deck.length}
        </span>
        <div
          className="h-1 flex-1 max-w-[200px] overflow-hidden rounded-full bg-vm-line"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress"
        >
          <div
            className="h-full rounded-full bg-vm-accent motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="sr-only">
        Swipe left marks red and shows the definition; swipe right marks green
        and goes to the next card.
      </p>

      <CardSwipeWrap
        enabled={deck.length > 0 && phase === 'study'}
        onSwipeLeft={swipeLeftMarkRedAndFlip}
        onSwipeRight={swipeGreenAndNext}
      >
        <FlipCard
          entry={entry}
          flipped={flipped}
          onToggleFlip={toggleFlip}
          reducedMotion={reducedMotion}
          recallMark={recallMark}
        />
      </CardSwipeWrap>

      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0 || deck.length === 0}
          className="rounded-full border border-vm-line bg-vm-bg px-3 py-2.5 font-body text-sm text-vm-ink transition-colors hover:bg-vm-sidebar disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent"
        >
          Back
        </button>
        <button
          type="button"
          onClick={markForgotten}
          disabled={deck.length === 0}
          className={`rounded-full border px-3 py-2.5 font-body text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 ${
            recallMark === 'forgotten'
              ? 'border-rose-500 bg-rose-100 ring-2 ring-rose-400/70 ring-offset-2 ring-offset-vm-bg text-rose-950'
              : 'border-rose-300/90 bg-rose-50 text-rose-950 hover:bg-rose-100/90'
          }`}
          aria-keyshortcuts="R"
          aria-pressed={recallMark === 'forgotten'}
          aria-label="Mark not remembered (red), shortcut R"
        >
          Red
          <span className="ml-1 tabular-nums text-[11px] font-normal opacity-70">
            R
          </span>
        </button>
        <button
          type="button"
          onClick={markRemembered}
          disabled={deck.length === 0}
          className={`rounded-full border px-3 py-2.5 font-body text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
            recallMark === 'remembered'
              ? 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-vm-bg text-emerald-950'
              : 'border-emerald-300/90 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/90'
          }`}
          aria-keyshortcuts="G"
          aria-pressed={recallMark === 'remembered'}
          aria-label="Mark remembered (green), shortcut G"
        >
          Green
          <span className="ml-1 tabular-nums text-[11px] font-normal opacity-70">
            G
          </span>
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={deck.length === 0}
          className="rounded-full border border-vm-accent bg-vm-accent-soft px-3 py-2.5 font-body text-sm font-medium text-vm-ink transition-colors hover:bg-vm-accent/18 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent"
        >
          {deck.length && index >= deck.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
