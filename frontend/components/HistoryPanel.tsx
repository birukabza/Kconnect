"use client";

import clsx from "clsx";
import { X, Trash2 } from "lucide-react";
import { useConversationStore } from "@/lib/conversationStore";
import { ExportButton } from "./ExportButton";

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

// Renders as a persistent sidebar on md+ screens and a slide-up drawer overlay
// on mobile, sharing the same conversationStore data as ConversationList — a
// denser, scannable view meant for reviewing/exporting the session rather
// than following it live.
export function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const messages = useConversationStore((s) => s.messages);
  const clearSession = useConversationStore((s) => s.clearSession);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Conversation history"
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-2xl bg-rw-bg p-4 shadow-2xl transition-transform md:static md:z-auto md:max-h-none md:w-80 md:shrink-0 md:translate-y-0 md:rounded-none md:border-l md:border-rw-blue/10 md:shadow-none",
          open ? "translate-y-0" : "translate-y-full md:translate-y-0"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-rw-ink">History</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSession}
              disabled={messages.length === 0}
              aria-label="Clear session history"
              className="rounded-full p-1.5 text-rw-ink/60 hover:bg-rw-blue/10 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history panel"
              className="rounded-full p-1.5 text-rw-ink/60 hover:bg-rw-blue/10 md:hidden"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <ExportButton />
        </div>

        <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto md:max-h-[calc(100vh-10rem)]">
          {messages.length === 0 ? (
            <p className="text-sm text-rw-ink/50">No exchanges yet this session.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-lg bg-white p-2.5 text-xs">
                <p className="text-rw-ink/60">{m.sourceText}</p>
                <p className="font-medium text-rw-ink">{m.translatedText}</p>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
