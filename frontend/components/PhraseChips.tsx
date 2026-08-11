"use client";

import { useState } from "react";
import clsx from "clsx";
import { PHRASE_CATEGORIES, PHRASES } from "@/lib/phrases";
import { useConversationStore } from "@/lib/conversationStore";
import { useConversePipeline } from "@/lib/useConversePipeline";
import { Toast } from "./ui/Toast";

export function PhraseChips() {
  const [category, setCategory] = useState<string>(PHRASE_CATEGORIES[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const direction = useConversationStore((s) => s.direction);
  const status = useConversationStore((s) => s.status);
  const runPipeline = useConversePipeline(setToastMessage);

  const busy = status === "processing" || status === "listening";
  const phrasesForCategory = PHRASES.filter((p) => p.category === category);

  async function handleChipTap(text: string) {
    if (busy) return;
    await runPipeline({ text });
  }

  return (
    <div className="border-t border-rw-blue/10 bg-white/60 px-3 py-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1.5" role="tablist" aria-label="Phrase categories">
        {PHRASE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => setCategory(cat)}
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
              category === cat ? "bg-rw-blue text-white" : "bg-rw-bg text-rw-ink/70 hover:bg-rw-blue/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pt-1">
        {phrasesForCategory.map((phrase) => (
          <button
            key={phrase.id}
            type="button"
            disabled={busy}
            onClick={() => handleChipTap(direction === "en-to-rw" ? phrase.en : phrase.rw)}
            className="shrink-0 whitespace-nowrap rounded-full border border-rw-blue/30 bg-white px-4 py-2 text-sm text-rw-ink transition-colors hover:border-rw-blue hover:bg-rw-blue/5 disabled:opacity-50"
          >
            {direction === "en-to-rw" ? phrase.en : phrase.rw}
          </button>
        ))}
      </div>
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </div>
  );
}
