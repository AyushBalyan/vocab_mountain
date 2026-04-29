import type { WordEntry } from '../types'

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Fisher–Yates shuffle with deterministic seed string */
export function seededShuffle<T>(seedStr: string, items: readonly T[]): T[] {
  let seed = hashString(seedStr)
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
    const j = seed % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function todayDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildDailyDeck(
  words: readonly WordEntry[],
  dateStr: string,
  groupId: number,
  dailyGoal: number,
): WordEntry[] {
  if (words.length === 0) return []
  const shuffled = seededShuffle(`${dateStr}:${groupId}`, words)
  const n = Math.min(Math.max(dailyGoal, 1), shuffled.length)
  return shuffled.slice(0, n)
}
