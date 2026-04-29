import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcPath = path.join(root, 'gregMat_vocab.json')
const outPath = path.join(root, 'public', 'vocabulary.json')

function titleCase(word) {
  const s = String(word ?? '').trim()
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * @param {unknown} d
 */
function normalizeDefinition(d) {
  if (!d || typeof d !== 'object') return null
  const pos =
    typeof d.part_of_speech === 'string' ? d.part_of_speech.trim() : ''
  const def =
    typeof d.definition === 'string' ? d.definition.trim() : ''
  if (!def) return null
  const example =
    typeof d.example === 'string' ? d.example.trim() : ''
  const synonyms = Array.isArray(d.synonyms)
    ? d.synonyms.filter((s) => typeof s === 'string').map((s) => s.trim())
    : []
  return {
    part_of_speech: pos,
    definition: def,
    example,
    synonyms,
  }
}

/**
 * @param {unknown} raw
 */
function itemToWord(raw) {
  if (!raw || typeof raw !== 'object') return null
  const wordRaw = raw.word
  const defs = raw.definitions
  if (typeof wordRaw !== 'string' || !Array.isArray(defs) || defs.length === 0)
    return null

  const definitions = defs
    .map(normalizeDefinition)
    .filter((x) => x !== null)
  if (!definitions.length) return null

  let pronunciation_url = null
  if (
    typeof raw.pronunciation_url === 'string' &&
    raw.pronunciation_url.trim()
  ) {
    pronunciation_url = raw.pronunciation_url.trim()
  }

  return {
    word: titleCase(wordRaw.trim()),
    pronunciation_url,
    definitions,
  }
}

const rawJson = fs.readFileSync(srcPath, 'utf8')
const items = JSON.parse(rawJson)
if (!Array.isArray(items)) {
  console.error('Expected gregMat_vocab.json to be a JSON array')
  process.exit(1)
}

/** @type {Map<number, Map<string, ReturnType<typeof itemToWord>>>} */
const groupBuckets = new Map()

for (const item of items) {
  if (!item || typeof item !== 'object') continue
  const g = item.group
  if (typeof g !== 'number' || !Number.isFinite(g)) continue

  const w = itemToWord(item)
  if (!w) continue

  if (!groupBuckets.has(g)) {
    groupBuckets.set(g, new Map())
  }
  const bucket = groupBuckets.get(g)
  const key = w.word.trim().toLowerCase()
  if (!bucket.has(key)) bucket.set(key, w)
}

function deckSignature(words) {
  return [...words.map((x) => x.word.trim().toLowerCase())]
    .sort()
    .join('\u001f')
}

const groupsRaw = [...groupBuckets.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([id, wordMap]) => ({
    id,
    words: [...wordMap.values()],
  }))

const groups = []
for (const g of groupsRaw) {
  const prev = groups[groups.length - 1]
  if (prev && deckSignature(prev.words) === deckSignature(g.words)) {
    console.warn(
      `Skipping Group ${g.id}: identical word list as Group ${prev.id}`,
    )
    continue
  }
  groups.push(g)
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify({ groups }, null, 2))

const totalWords = groups.reduce((s, g) => s + g.words.length, 0)
console.log(`Wrote ${groups.length} groups, ${totalWords} words → ${outPath}`)
