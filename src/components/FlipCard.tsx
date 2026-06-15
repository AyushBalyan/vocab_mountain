import { useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'
import type { RecallMark, WordEntry } from '../types'

type FlipCardProps = {
  entry: WordEntry | undefined
  flipped: boolean
  onToggleFlip: () => void
  reducedMotion: boolean
  recallMark?: RecallMark | null
}

function toneClasses(mark: RecallMark | null | undefined): string {
  if (mark === 'remembered') {
    return 'border-emerald-200/90 bg-emerald-50/95 shadow-emerald-950/[0.06]'
  }
  if (mark === 'forgotten') {
    return 'border-rose-200/90 bg-rose-50/95 shadow-rose-950/[0.06]'
  }
  return 'border-vm-line bg-vm-paper shadow-[var(--shadow-card)]'
}

function PronounceButton({ url }: { url: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!url) return
    const a = new Audio(url)
    audioRef.current = a
    return () => {
      a.pause()
      audioRef.current = null
    }
  }, [url])

  if (!url) return null

  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-vm-line bg-vm-bg p-2 text-vm-ink shadow-sm hover:bg-vm-sidebar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent"
      aria-label="Play pronunciation"
      onClick={(e) => {
        e.stopPropagation()
        const a = audioRef.current
        if (!a) return
        a.currentTime = 0
        void a.play().catch(() => {
          /* autoplay blocked or network */
        })
      }}
    >
      <Volume2 size={20} aria-hidden strokeWidth={2} />
    </button>
  )
}

function DefinitionBlocks({ entry }: { entry: WordEntry }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 border-b border-vm-line pb-4">
        <h3 className="font-display flex-1 text-left text-xl font-semibold tracking-tight text-vm-ink sm:text-2xl">
          {entry.word}
        </h3>
        <PronounceButton url={entry.pronunciation_url} />
      </div>
      {entry.definitions.map((def, i) => (
        <section
          key={`${def.part_of_speech}-${i}`}
          className="flex flex-col gap-2 text-left"
        >
          {def.part_of_speech ? (
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-vm-accent">
              {def.part_of_speech}
            </p>
          ) : null}
          <p className="font-body text-[17px] leading-snug text-vm-ink">{def.definition}</p>
          {def.example ? (
            <blockquote className="font-body mt-1 border-l-2 border-vm-accent/40 pl-3 text-[15px] italic leading-relaxed text-vm-muted">
              {def.example}
            </blockquote>
          ) : null}
          {def.synonyms.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
              <span className="font-body text-[11px] font-medium uppercase tracking-wide text-vm-muted">
                Synonyms
              </span>
              <div className="flex flex-wrap gap-1.5">
                {def.synonyms.map((s, si) => (
                  <span
                    key={`${s}-${si}`}
                    className="rounded-full border border-vm-line bg-vm-bg px-2.5 py-0.5 font-body text-xs text-vm-ink"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}

export function FlipCard({
  entry,
  flipped,
  onToggleFlip,
  reducedMotion,
  recallMark,
}: FlipCardProps) {
  const tone = toneClasses(recallMark ?? null)

  if (!entry) {
    return (
      <div
        className={`flex min-h-[min(340px,65dvh)] w-full max-w-xl flex-col items-center justify-center cursor-default rounded-lg border border-vm-line bg-vm-paper px-8 py-10 text-left shadow-[var(--shadow-card)] outline-none`}
      >
        <p className="font-body text-vm-muted">Empty deck.</p>
      </div>
    )
  }

  const shellTone = `rounded-lg border px-8 py-10 text-left outline-none ring-vm-accent transition-[background-color,border-color,box-shadow] motion-safe:duration-300 focus-visible:ring-2 ${tone}`

  if (reducedMotion) {
    return (
      <div
        className={`${shellTone} flex min-h-[min(340px,65dvh)] w-full max-w-xl flex-col`}
      >
        {!flipped ? (
          <div
            className="flex min-h-[240px] cursor-pointer flex-col gap-4"
            onClick={onToggleFlip}
          >
            <div className="flex w-full justify-end">
              <PronounceButton url={entry.pronunciation_url} />
            </div>
            <p className="font-display text-center text-[clamp(2rem,7vw,3rem)] font-semibold leading-[1.08] tracking-tight text-vm-ink">
              {entry.word}
            </p>
          </div>
        ) : (
          <div className="cursor-pointer text-left" onClick={onToggleFlip}>
            <DefinitionBlocks entry={entry} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative w-full max-w-xl rounded-lg outline-none ring-vm-accent transition-[background-color] motion-safe:duration-300 focus-within:ring-2"
      style={{ perspective: '1400px' }}
    >
      <div
        className={`relative mx-auto min-h-[300px] w-full min-w-0 max-h-[min(78dvh,820px)] [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 flex cursor-pointer flex-col overflow-y-auto rounded-lg border px-5 py-7 [backface-visibility:hidden] [transform:rotateY(0deg)] motion-safe:transition-[background-color,border-color] motion-safe:duration-300 sm:px-7 sm:py-9 ${tone}`}
          onClick={onToggleFlip}
          aria-hidden={flipped}
        >
          <div className="flex w-full shrink-0 items-start justify-end gap-2">
            <PronounceButton url={entry.pronunciation_url} />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-1">
            <p className="font-display text-center text-[clamp(1.85rem,6.5vw,2.85rem)] font-semibold leading-[1.08] tracking-tight text-vm-ink">
              {entry.word}
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 flex cursor-pointer flex-col overflow-y-auto rounded-lg border px-5 py-7 [backface-visibility:hidden] [transform:rotateY(180deg)] motion-safe:transition-[background-color,border-color] motion-safe:duration-300 sm:px-7 sm:py-9 ${tone}`}
          onClick={onToggleFlip}
          aria-hidden={!flipped}
        >
          <DefinitionBlocks entry={entry} />
        </div>
      </div>
    </div>
  )
}
