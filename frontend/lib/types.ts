export type Lang = "en" | "rw";

export type Direction = "en-to-rw" | "rw-to-en";

export type MicStatus = "idle" | "listening" | "processing" | "speaking" | "error";

export type InputType = "audio" | "text";

export interface Message {
  id: string;
  direction: Direction;
  inputType: InputType;
  sourceText: string;
  sourceLang: Lang;
  translatedText: string;
  targetLang: Lang;
  warnings?: string[];
  createdAt: number;
  // Absent (undefined) means "done" — only messages inserted optimistically
  // while the pipeline is still in flight carry "pending"/"error".
  status?: "pending" | "done" | "error";
}

// Contract for the real backend `converse` endpoint (Supabase Edge Function:
// Speech-to-Text -> Translation -> Text-to-Speech). Exactly one of `text` /
// `audioBlob` is set — which one tells the backend whether to run STT first.
// There's no separate `inputType` flag: it would just be a second source of
// truth for the same thing, so callers derive it (`audioBlob ? "audio" : "text"`)
// instead of passing it.
export interface ConverseRequest {
  direction: Direction;
  text?: string;
  audioBlob?: Blob;
}

export interface ConverseResponse {
  sourceText: string;
  translatedText: string;
  warnings?: string[];
}

export interface Phrase {
  id: string;
  category: string;
  en: string;
  rw: string;
}
