# KConnect AI

Helps foreigners in Rwanda communicate with locals across the English↔Kinyarwanda language barrier  speak in one language, hear it spoken aloud in the other.

Frontend is a fully interactive Next.js app (mic recording, text input, quick-phrase shortcuts, conversation history, export). It currently runs against a mock translation pipeline (`frontend/lib/mockConverse.ts`), so it works with no backend wired up yet.

## Repo layout

- `frontend/` — the Next.js app (see below)
- `Backend/` — not built yet; see "Backend integration" below for the contract to implement

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## What's real vs. simulated

- **Real**: mic permission/recording (`MediaRecorder`), UI state machine, conversation history (persisted to `localStorage`), quick-phrase translations for the phrases in `lib/phrases.ts`, spoken playback via the browser's Web Speech API, copy/download transcript.
- **Simulated**: text outside the known phrase list gets a placeholder translation (`[demo translation] ...`); recorded audio gets a placeholder transcript — no Speech-to-Text is wired up yet.

## Backend integration

The frontend calls one function, `mockConverse(request)` in `frontend/lib/mockConverse.ts`. To go live, replace its internals with a real API call — the request/response shape below is the contract to keep, defined in `frontend/lib/types.ts`:

```ts
interface ConverseRequest {
  direction: "en-to-rw" | "rw-to-en";
  text?: string;       // set for typed input
  audioBlob?: Blob;    // set for recorded voice input — exactly one of text/audioBlob is present
}

interface ConverseResponse {
  sourceText: string;       // transcript if audio came in, echo of `text` if text came in
  translatedText: string;
  warnings?: string[];      // non-fatal issues to surface in the UI (e.g. STT/TTS degraded)
}
```

Note: `audioBlob` is a browser `Blob` — not JSON-serializable as-is. The real endpoint will need multipart/form-data or base64 for the audio payload; that encoding decision is up to whoever builds it.
