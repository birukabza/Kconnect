# KConnect AI

An AI companion that helps foreigners in Rwanda communicate with locals across the English↔Kinyarwanda language barrier — speak in one language, hear it spoken aloud in the other.

This is the **UI-first build**: a fully interactive Next.js app with mic recording, text input, quick-phrase shortcuts, conversation history, and export — all wired to a mock translation pipeline (`lib/mockConverse.ts`) so the whole experience works without any backend or Google Cloud credentials yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What's real vs. simulated right now

- **Real**: mic permission/recording (`MediaRecorder`), UI state machine, conversation history (persisted to `localStorage`), quick-phrase translations for the phrases in `lib/phrases.ts`, spoken playback via the browser's built-in Web Speech API, copy/download transcript.
- **Simulated**: for text outside the known phrase list, translation is a placeholder (`[demo translation] ...`); for recorded audio, transcription is a placeholder since no Speech-to-Text is wired up yet.

## Next steps (Phase 2 — not built yet)

Wire up the real pipeline by replacing the internals of `lib/mockConverse.ts` with a call to a Supabase Edge Function that proxies Google Cloud Speech-to-Text, Cloud Translation, and Text-to-Speech (keeping the service-account credential server-side). See the full architecture and setup steps in the original plan: `~/.claude/plans/kconnect-ai-an-lazy-shannon.md`.

**Known risk to verify first**: Google Cloud's Text-to-Speech/Speech-to-Text may have limited or no Kinyarwanda voice support. Do a live API check before building further backend around it — Cloud Translation does support `rw` text translation regardless.

## Project structure

- `app/` — Next.js App Router pages and layout
- `components/` — UI components (MicButton, ConversationBubble, LanguageToggle, PhraseChips, HistoryPanel, etc.)
- `lib/` — state (Zustand store), audio recording, mock pipeline, phrase data, export helpers
# Kconnect
