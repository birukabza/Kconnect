import { useCallback } from "react";
import { useConversationStore } from "./conversationStore";
import { mockConverse, speak } from "./mockConverse";
import { Direction, Message } from "./types";

function langsForDirection(direction: Direction) {
  return direction === "en-to-rw"
    ? { source: "en" as const, target: "rw" as const }
    : { source: "rw" as const, target: "en" as const };
}

// Shared translate+speak pipeline. All conversation state (messages, mic
// status) lives in the Zustand store, so any component that calls this hook
// — MicButton, TextInputBar, PhraseChips — drives the same global state
// without needing to prop-drill through one another.
export function useConversePipeline(onWarning?: (message: string) => void) {
  const direction = useConversationStore((s) => s.direction);
  const setStatus = useConversationStore((s) => s.setStatus);
  const addMessage = useConversationStore((s) => s.addMessage);
  const updateMessage = useConversationStore((s) => s.updateMessage);
  const toggleDirection = useConversationStore((s) => s.toggleDirection);

  return useCallback(
    async (input: { audioBlob?: Blob; text?: string; direction?: Direction }) => {
      // Conversation mode: callers that can tell what language was actually
      // typed (TextInputBar, via detectLanguage) pass an explicit override;
      // otherwise we use whatever direction is currently expected — see the
      // auto-flip below.
      const effectiveDirection = input.direction ?? direction;
      const { source, target } = langsForDirection(effectiveDirection);
      const inputType: Message["inputType"] = input.audioBlob ? "audio" : "text";
      const id = crypto.randomUUID();

      // Insert the bubble immediately, before the (mock) network roundtrip —
      // text input already gives us the source text, so there's no reason to
      // make the user wait on a spinner to see their own message land. The
      // translation fills in a moment later, feeling like a live exchange
      // rather than a request/response gap.
      addMessage({
        id,
        direction: effectiveDirection,
        inputType,
        sourceText: input.text ?? "Transcribing your voice…",
        sourceLang: source,
        translatedText: "",
        targetLang: target,
        createdAt: Date.now(),
        status: "pending",
      });

      setStatus("processing");
      try {
        const response = await mockConverse({
          direction: effectiveDirection,
          audioBlob: input.audioBlob,
          text: input.text,
        });

        updateMessage(id, {
          sourceText: response.sourceText,
          translatedText: response.translatedText,
          warnings: response.warnings,
          status: "done",
        });

        setStatus("speaking");
        const { warning } = speak(response.translatedText, target);
        if (warning) onWarning?.(warning);

        // Assume a real back-and-forth: the next turn is likely the other
        // person replying, so flip the expected direction now. Audio input
        // has no way to detect language from mock (or even real, without
        // Google's STT language hints wired up) speech content, so this
        // alternation is its best guess; text input overrides it per-message
        // by detecting the language of what was actually typed (TextInputBar
        // calls setDirection before invoking this, so the store already
        // reflects effectiveDirection here — toggling always flips relative
        // to *this* turn, not a stale one).
        toggleDirection();

        // speechSynthesis has no reliable cross-browser "done" event wired up
        // here, so return to idle after a short buffer — replay buttons on
        // each bubble let the user re-hear it regardless.
        setTimeout(() => setStatus("idle"), 1600);
      } catch (err) {
        updateMessage(id, { status: "error" });
        setStatus("error");
        onWarning?.(err instanceof Error ? err.message : "Something went wrong.");
        setTimeout(() => setStatus("idle"), 1500);
      }
    },
    [direction, setStatus, addMessage, updateMessage, toggleDirection, onWarning]
  );
}
