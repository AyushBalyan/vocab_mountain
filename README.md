# Vocab Mountain

A static **GRE vocabulary** flashcard app (GregMat word groups). Words are built from [`gregMat_vocab.json`](./gregMat_vocab.json) at build time into `public/vocabulary.json`.

## Scripts

| Command | Description |
|--------|-------------|
| `npm install` | Install dependencies |
| `npm run vocab:data` | Regenerate `public/vocabulary.json` from `gregMat_vocab.json` |
| `npm run dev` | Regenerate data, then start Vite dev server |
| `npm run build` | Regenerate data, typecheck, production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Features

- **Group chips** — Switch between vocabulary groups.
- **Flip cards** — Word on the front; meaning and example on the back (3D flip, or instant swap when `prefers-reduced-motion` is set).
- **Daily deck vs all cards** — Daily mode picks a deterministic subset per calendar day and group (goal 5–50, stored in `localStorage`). All mode walks the full group in order.
- **Keyboard** — `Space` flips; `←` / `→` move between cards.

## Editing the word list

Edit [`gregMat_vocab.json`](./gregMat_vocab.json), then run `npm run vocab:data` (or any build/dev command) to refresh `public/vocabulary.json`.

Source entries include `group`, `word`, optional `pronunciation_url`, and `definitions` (each with `part_of_speech`, `definition`, `example`, `synonyms`). The app shows all of this on the card back and exposes pronunciation via a speaker button.
