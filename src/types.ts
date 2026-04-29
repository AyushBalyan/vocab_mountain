export type RecallMark = 'remembered' | 'forgotten'

export interface DefinitionEntry {
  part_of_speech: string
  definition: string
  example: string
  synonyms: string[]
}

export interface WordEntry {
  word: string
  /** URL to MP3 or other audio; null if missing */
  pronunciation_url: string | null
  definitions: DefinitionEntry[]
}

export interface GroupSection {
  id: number
  words: WordEntry[]
}

export interface VocabularyBundle {
  groups: GroupSection[]
}
