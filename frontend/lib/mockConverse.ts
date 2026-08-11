import { ConverseRequest, ConverseResponse, Lang } from "./types";
import { findPhraseTranslation } from "./phrases";

// Stand-in for the eventual Supabase `converse` Edge Function (Google Cloud
// Speech-to-Text -> Translation -> Text-to-Speech). Same request/response
// shape as the real backend will use, so swapping this module out later is a
// one-file change — no component depends on anything beyond this contract.
//
// Contract for whoever builds the real endpoint (see ConverseRequest /
// ConverseResponse in ./types):
//   Input  — direction: "en-to-rw" | "rw-to-en", plus exactly ONE of:
//              text        (string, already-typed source text), or
//              audioBlob   (recorded speech to run through STT first)
//   Output — sourceText (transcript if audio in, echo of `text` if text in),
//            translatedText, and an optional warnings[] for anything
//            degraded (e.g. STT/TTS unavailable) that the UI should surface
//            without failing the request outright.

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockConverse(request: ConverseRequest): Promise<ConverseResponse> {
  // Simulate STT + Translation + TTS network latency.
  await sleep(800 + Math.random() * 700);

  if (request.audioBlob) {
    // No real Speech-to-Text is wired up yet, so we can't transcribe whatever
    // was actually said — but a silent generic placeholder every time makes
    // the mic feel broken rather than "not wired up." Instead, assume the
    // canonical demo exchange for whichever side is speaking: the English
    // speaker says a greeting, the Kinyarwanda speaker gives directions
    // (mirrors lib/phrases.ts "greet-1" and "dir-7") — enough to demo the
    // full conversation loop convincingly until real STT replaces this.
    const { sourceText, translatedText } =
      request.direction === "en-to-rw"
        ? { sourceText: "Hello", translatedText: "Muraho" }
        : { sourceText: "Uranyura hariya haruguru", translatedText: "You pass up there" };
    return {
      sourceText,
      translatedText,
      warnings: ["Voice transcription is not connected yet — this is a canned demo response, not a real transcript."],
    };
  }

  const text = request.text ?? "";
  const known = findPhraseTranslation(text, request.direction);
  const translatedText = known ?? `[demo translation] ${text}`;

  return {
    sourceText: text,
    translatedText,
    warnings: known ? undefined : ["Not a recognized demo phrase — showing a placeholder translation."],
  };
}

// Speaks `text` aloud using the browser's built-in Web Speech API, standing in
// for the real Text-to-Speech call. Kinyarwanda voices are rarely available in
// browsers, so this degrades gracefully (falls back to any available voice,
// or silently no-ops) rather than throwing — real Kinyarwanda TTS is a Phase 2
// dependency on Google Cloud (or an alternate provider if that gap is real).
export function speak(text: string, lang: Lang): { spoken: boolean; warning?: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { spoken: false, warning: "Speech synthesis is not supported in this browser." };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const targetLangCode = lang === "rw" ? "rw" : "en";
  const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetLangCode));

  if (matchingVoice) {
    utterance.voice = matchingVoice;
    utterance.lang = matchingVoice.lang;
  } else {
    utterance.lang = lang === "rw" ? "rw-RW" : "en-US";
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  if (lang === "rw" && !matchingVoice) {
    return {
      spoken: true,
      warning: "Kinyarwanda voice not available in this browser — demo only.",
    };
  }

  return { spoken: true };
}
