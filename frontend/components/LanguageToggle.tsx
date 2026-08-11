"use client";

import { ArrowLeftRight } from "lucide-react";
import { useConversationStore } from "@/lib/conversationStore";

// Direction is auto-detected per message now (lib/detectLanguage.ts for
// typed text, an auto-flip in useConversePipeline for audio), so this is no
// longer a "pick a direction before you type" control — it's a single,
// low-emphasis override for the rare case detection guesses wrong. It used
// to be 3 separate buttons (a 2-button segmented control on larger screens
// plus a duplicate compact swap button on mobile) that all did the same
// thing; collapsed to one so it doesn't read as a required step.
export function LanguageToggle() {
  const direction = useConversationStore((s) => s.direction);
  const toggleDirection = useConversationStore((s) => s.toggleDirection);

  return (
    <button
      type="button"
      onClick={toggleDirection}
      aria-label={`Auto-detecting ${
        direction === "en-to-rw" ? "English to Kinyarwanda" : "Kinyarwanda to English"
      } — tap to override`}
      title="Auto-detected — tap to override"
      className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/25"
    >
      <span>{direction === "en-to-rw" ? "EN" : "RW"}</span>
      <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
      <span>{direction === "en-to-rw" ? "RW" : "EN"}</span>
    </button>
  );
}
