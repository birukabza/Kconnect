"use client";

import { FormEvent, useState } from "react";
import clsx from "clsx";
import { Send } from "lucide-react";
import { useConversationStore } from "@/lib/conversationStore";
import { useConversePipeline } from "@/lib/useConversePipeline";
import { detectLanguage } from "@/lib/detectLanguage";
import { Toast } from "./ui/Toast";

export function TextInputBar() {
  const [value, setValue] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const status = useConversationStore((s) => s.status);
  const direction = useConversationStore((s) => s.direction);
  const setDirection = useConversationStore((s) => s.setDirection);
  const runPipeline = useConversePipeline(setToastMessage);

  // Conversation mode: detect the language of what's being typed instead of
  // requiring a direction to be picked first — see lib/detectLanguage.ts.
  // Null means "ambiguous" (too short / no recognizable words yet), in which
  // case we fall back to whichever direction the conversation currently
  // expects rather than guessing.
  const detected = detectLanguage(value);
  const detectedDirection = detected === "en" ? "en-to-rw" : detected === "rw" ? "rw-to-en" : null;

  const placeholder = "Type in English or Kinyarwanda…";
  const busy = status === "processing" || status === "listening";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    const effectiveDirection = detectedDirection ?? direction;
    if (effectiveDirection !== direction) setDirection(effectiveDirection);
    await runPipeline({ text, direction: effectiveDirection });
  }

  return (
    <div className="flex flex-1 flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="text-input" className="sr-only">
          Message to translate
        </label>
        <input
          id="text-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="min-w-0 flex-1 rounded-full border border-rw-blue/20 bg-white px-4 py-3 text-sm text-rw-ink placeholder:text-rw-ink/40 focus:outline-none focus:ring-2 focus:ring-rw-blue disabled:bg-rw-bg"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          aria-label="Send message (or press Enter)"
          title="Press Enter to send"
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rw-blue text-white transition-all duration-150",
            value.trim() ? "scale-100 opacity-100" : "scale-90 opacity-30",
            "disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
      {/* Fixed-height row (rendered even when empty) so the hint fading in
          doesn't shift the layout — live feedback on which way this message
          will translate, no direction picker required. */}
      <p className="h-4 px-4 text-xs text-rw-ink/40" aria-live="polite">
        {value.trim() &&
          (detectedDirection
            ? detectedDirection === "en-to-rw"
              ? "Detected: English → Kinyarwanda"
              : "Detected: Kinyarwanda → English"
            : "Auto-detecting…")}
      </p>
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </div>
  );
}
