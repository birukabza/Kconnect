"use client";

import { Message } from "@/lib/types";
import { Spinner } from "./ui/Spinner";

export function ConversationBubble({
  message,
}: {
  message: Message;
}) {
  const isPending = message.status === "pending";

  return (
    <div className="w-full max-w-md animate-in fade-in duration-300">
      <div className="rounded-3xl bg-white px-6 py-5 text-center shadow-sm">
        {message.sourceText && (
          <p className="text-sm italic leading-relaxed text-rw-ink/40">
            {message.sourceText}
          </p>
        )}

        {isPending ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-rw-ink/50">
            <Spinner className="h-4 w-4" />
            <span>Translating…</span>
          </div>
        ) : (
          <p className="mt-3 text-xl font-semibold leading-relaxed text-rw-ink">
            {message.translatedText}
          </p>
        )}
      </div>
    </div>
  );
}