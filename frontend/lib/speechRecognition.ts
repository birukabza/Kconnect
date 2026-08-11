// Best-effort REAL speech-to-text via the browser's Web Speech API
// (SpeechRecognition / webkitSpeechRecognition) — unlike the rest of the
// mock pipeline, this actually transcribes what was said, no backend needed.
//
// Why this matters for conversation mode: audio input has no content to run
// detectLanguage() on (see lib/detectLanguage.ts), so it can only guess the
// next turn's language by alternating — which breaks the moment the same
// person speaks twice in a row. Where a real transcript is available, we can
// run the same detector used for typed text on genuine spoken content and
// know for sure, instead of guessing.
//
// The catch: this only ever requests English recognition. No mainstream
// browser ships a Kinyarwanda speech recognizer, so there is currently no
// way to get a real transcript for that side — repeated Kinyarwanda turns
// still rely on the alternation guess (and the manual override toggle) until
// the real backend (Google Cloud Speech-to-Text with an rw-RW language hint)
// replaces this. See README's Phase 2 notes.

function getRecognitionCtor(): (new () => any) | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}

export class LiveTranscriber {
  static isSupported(): boolean {
    return !!getRecognitionCtor();
  }

  private recognition: any;
  private finalTranscript = "";
  private stopped = false;

  constructor() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) throw new Error("SpeechRecognition is not supported in this browser.");

    this.recognition = new Ctor();
    this.recognition.lang = "en-US"; // the only language we can reliably recognize client-side
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          this.finalTranscript += (this.finalTranscript ? " " : "") + result[0].transcript.trim();
        }
      }
    };

    // This is a best-effort enhancement layered on top of the mic flow, not
    // something it should ever fail on — swallow recognition errors
    // (no-speech, not-allowed, network, language-not-supported, etc.) and let
    // the caller fall back to the existing mock-audio path.
    this.recognition.onerror = () => {};

    try {
      this.recognition.start();
    } catch {
      // Some browsers throw if recognition is started twice in a race —
      // treat as "no transcript available" rather than crashing the mic flow.
    }
  }

  /** Stops listening and returns whatever final transcript was captured. */
  stop(): string {
    if (!this.stopped) {
      this.stopped = true;
      try {
        this.recognition.stop();
      } catch {
        // already stopped/never started — ignore
      }
    }
    return this.finalTranscript.trim();
  }
}
