import { ConverseRequest, ConverseResponse, Lang } from "./types";
import { findPhraseTranslation } from "./phrases";

// Stand-in for the eventual Supabase `converse` Edge Function.
// The request/response contract remains unchanged so the real backend
// can replace this module later without requiring component changes.

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockConverse(
  request: ConverseRequest
): Promise<ConverseResponse> {
  // Simulate STT + Translation + TTS network latency.
  await sleep(800 + Math.random() * 700);

  if (request.audioBlob) {
    // No real Speech-to-Text is wired up in this mock.
    // Keep the existing canned demo exchange until the real backend
    // provides the transcript.
    const { sourceText, translatedText } =
      request.direction === "en-to-rw"
        ? {
            sourceText: "Hello",
            translatedText: "Muraho",
          }
        : {
            sourceText: "Uranyura hariya haruguru",
            translatedText: "You pass up there",
          };

    return {
      sourceText,
      translatedText,
      warnings: [
        "Voice transcription is not connected yet — this is a canned demo response, not a real transcript.",
      ],
    };
  }

  const text = request.text ?? "";
  const known = findPhraseTranslation(text, request.direction);
  const translatedText = known ?? `[demo translation] ${text}`;

  return {
    sourceText: text,
    translatedText,
    warnings: known
      ? undefined
      : [
          "Not a recognized demo phrase — showing a placeholder translation.",
        ],
  };
}

/**
 * Speak text using the browser Web Speech API.
 *
 * `finished` resolves when the browser actually finishes speaking.
 * This allows the conversation pipeline to synchronize the UI with
 * the real speech lifecycle instead of relying on a fixed timeout.
 */
export function speak(
  text: string,
  lang: Lang
): {
  spoken: boolean;
  warning?: string;
  finished: Promise<void>;
} {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return {
      spoken: false,
      warning: "Speech synthesis is not supported in this browser.",
      finished: Promise.resolve(),
    };
  }

  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();

  const targetLangCode = lang === "rw" ? "rw" : "en";

  const matchingVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(targetLangCode)
  );

  if (matchingVoice) {
    utterance.voice = matchingVoice;
    utterance.lang = matchingVoice.lang;
  } else {
    utterance.lang = lang === "rw" ? "rw-RW" : "en-US";
  }

  /*
   * The promise resolves when speech has genuinely finished.
   *
   * It also resolves if speech is cancelled or encounters an error,
   * so the UI can never remain stuck in the "speaking" state.
   */
  const finished = new Promise<void>((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;

      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(utterance);
  });

  if (lang === "rw" && !matchingVoice) {
    return {
      spoken: true,
      warning:
        "Kinyarwanda voice not available in this browser — demo only.",
      finished,
    };
  }

  return {
    spoken: true,
    finished,
  };
}