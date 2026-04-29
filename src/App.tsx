import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { StudySession } from './components/StudySession'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { buildDailyDeck, todayDateString } from './lib/deck'
import type { GroupSection, VocabularyBundle } from './types'

const STORAGE_GOAL = 'vocabMountain:dailyGoal'
const STORAGE_MODE = 'vocabMountain:studyMode'

function clampGoal(n: number): number {
  return Math.min(50, Math.max(5, Math.round(n)))
}

export default function App() {
  const [bundle, setBundle] = useState<VocabularyBundle | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [studyMode, setStudyMode] = useState<'daily' | 'all'>(() => {
    try {
      const m = localStorage.getItem(STORAGE_MODE)
      return m === 'all' ? 'all' : 'daily'
    } catch {
      return 'daily'
    }
  })
  const [dailyGoal, setDailyGoal] = useState(() => {
    try {
      const g = localStorage.getItem(STORAGE_GOAL)
      return clampGoal(g ? parseInt(g, 10) : 20)
    } catch {
      return 20
    }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    fetch('/vocabulary.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<VocabularyBundle>
      })
      .then((data) => {
        setBundle(data)
        if (data.groups.length > 0) {
          setSelectedGroupId((prev) =>
            prev !== null ? prev : data.groups[0].id,
          )
        }
      })
      .catch((e: unknown) =>
        setLoadErr(e instanceof Error ? e.message : 'Failed to load vocabulary'),
      )
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GOAL, String(dailyGoal))
    } catch {
      /* ignore */
    }
  }, [dailyGoal])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODE, studyMode)
    } catch {
      /* ignore */
    }
  }, [studyMode])

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const selectedGroup = useMemo<GroupSection | undefined>(() => {
    if (!bundle || selectedGroupId === null) return undefined
    return bundle.groups.find((g) => g.id === selectedGroupId)
  }, [bundle, selectedGroupId])

  const deck = useMemo(() => {
    if (!selectedGroup?.words.length) return []
    if (studyMode === 'all') return [...selectedGroup.words]
    return buildDailyDeck(
      selectedGroup.words,
      todayDateString(),
      selectedGroup.id,
      dailyGoal,
    )
  }, [selectedGroup, studyMode, dailyGoal])

  const sessionKey = `${selectedGroupId ?? 'none'}-${studyMode}-${dailyGoal}`

  const sidebarDrawer = (
    <>
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close menu"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        className={`fixed inset-0 z-[100] bg-black/15 transition-opacity motion-safe:duration-200 ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="app-sidebar"
        aria-hidden={!sidebarOpen}
        aria-modal={sidebarOpen}
        role="dialog"
        aria-labelledby="sidebar-title"
        className={`fixed left-0 top-0 z-[110] flex h-[100dvh] max-h-[100dvh] w-[min(18rem,92vw)] max-w-full flex-col overflow-hidden border-r border-vm-line bg-vm-sidebar shadow-xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-vm-line px-5 py-4">
          <span
            id="sidebar-title"
            className="font-display text-lg font-semibold text-vm-ink"
          >
            Deck
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 text-vm-muted hover:bg-black/[0.04] hover:text-vm-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent"
            aria-label="Close menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-8 pb-safe">
            {loadErr && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {loadErr}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <span className="font-body text-xs font-medium text-vm-muted">
                Group
              </span>
              <div className="flex flex-col gap-1">
                {(bundle?.groups ?? []).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(g.id)
                      setSidebarOpen(false)
                    }}
                    className={`rounded-md px-3 py-2 text-left font-body text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent ${
                      selectedGroupId === g.id
                        ? 'bg-vm-accent-soft font-medium text-vm-ink'
                        : 'text-vm-muted hover:bg-black/[0.04] hover:text-vm-ink'
                    }`}
                  >
                    Group {g.id}{' '}
                    <span className="tabular-nums opacity-60">
                      ({g.words.length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-body text-xs font-medium text-vm-muted">
                Mode
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStudyMode('daily')}
                  className={`flex-1 rounded-md border px-3 py-2 font-body text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent ${
                    studyMode === 'daily'
                      ? 'border-vm-accent bg-vm-accent-soft text-vm-ink'
                      : 'border-vm-line bg-vm-bg text-vm-muted hover:border-vm-line hover:text-vm-ink'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setStudyMode('all')}
                  className={`flex-1 rounded-md border px-3 py-2 font-body text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent ${
                    studyMode === 'all'
                      ? 'border-vm-accent bg-vm-accent-soft text-vm-ink'
                      : 'border-vm-line bg-vm-bg text-vm-muted hover:border-vm-line hover:text-vm-ink'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-2 font-body text-sm text-vm-muted">
              Daily limit
              <input
                type="number"
                min={5}
                max={50}
                value={dailyGoal}
                disabled={studyMode !== 'daily'}
                onChange={(e) =>
                  setDailyGoal(
                    clampGoal(Number.parseInt(e.target.value, 10) || 20),
                  )
                }
                className="rounded-md border border-vm-line bg-vm-bg px-3 py-2 font-body tabular-nums text-vm-ink outline-none ring-vm-accent focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </label>
          </div>
        </div>
        <footer className="shrink-0 border-t border-vm-line px-5 py-4">
          <p className="font-body text-[11px] leading-relaxed text-vm-muted">
            Vocabulary data sourced from{' '}
            <a
              href="https://www.gregmat.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-vm-ink underline decoration-vm-line/80 underline-offset-2 hover:text-vm-accent hover:decoration-vm-accent"
            >
              Arush Balyan
            </a>
            .
          </p>
        </footer>
      </aside>
    </>
  )

  return (
    <div className="vm-grain relative isolate flex min-h-dvh flex-col bg-vm-bg font-body text-vm-ink">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-vm-line bg-vm-bg/95 px-4 py-3 backdrop-blur-md md:px-6">
        <h1 className="font-display text-xl font-semibold tracking-tight text-vm-ink md:text-2xl">
          Vocab Mountain
        </h1>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 rounded-md border border-vm-line bg-vm-bg px-3 py-2 font-body text-sm text-vm-ink hover:bg-vm-sidebar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vm-accent"
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
          aria-label="Open deck settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline">Menu</span>
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8 md:px-8 md:py-12">
        <StudySession
          key={sessionKey}
          deck={deck}
          groupId={selectedGroup?.id}
          reducedMotion={reducedMotion}
        />
      </main>

      {createPortal(sidebarDrawer, document.body)}
    </div>
  )
}
