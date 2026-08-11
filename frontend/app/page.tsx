"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ConversationList } from "@/components/ConversationList";
import { PhraseChips } from "@/components/PhraseChips";
import { TextInputBar } from "@/components/TextInputBar";
import { MicButton } from "@/components/MicButton";
import { HistoryPanel } from "@/components/HistoryPanel";

export default function Home() {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 bg-rw-blue px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">KConnect</span>
            <span className="rounded-full bg-rw-yellow px-2 py-0.5 text-xs font-semibold text-rw-ink">
              AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Open conversation history"
              className="rounded-full p-2 text-white hover:bg-white/10 md:hidden"
            >
              <History className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          <ConversationList />
          <PhraseChips />
          <div className="flex items-center gap-3 border-t border-rw-blue/10 bg-white px-3 py-3 sm:px-4">
            <TextInputBar />
            <MicButton />
          </div>
        </main>
      </div>

      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
