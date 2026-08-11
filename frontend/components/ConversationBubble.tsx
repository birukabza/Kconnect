"use client";

import clsx from "clsx";
import { Volume2, AlertCircle } from "lucide-react";
import { Message } from "@/lib/types";
import { speak } from "@/lib/mockConverse";
import { Spinner } from "./ui/Spinner";

const LANG_LABEL: Record<string, string> = { en: "English", rw: "Kinyarwanda" };

export function ConversationBubble({ message }: { message: Message }) {
  const isEnToRw = message.direction === "en-to-rw";
  const isPending = message.status === "pending";
  const isPendingAudio = isPending && message.inputType === "audio";

  function replay() {
    if (isPending) return;
    speak(message.translatedText, message.targetLang);
  }

  return (
    <div className={clsx("flex", isEnToRw ? "justify-start" : "justify-end")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl bg-white px-4 py-3 shadow-sm sm:max-w-[70%]",
          isEnToRw ? "border-l-4 border-rw-blue" : "border-r-4 border-rw-green"
        )}
      >
        <p className={clsx("text-sm text-rw-ink/60", isPendingAudio && "italic")}>
          {message.sourceText}
        </p>
        {isPending ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-rw-ink/40">
            <Spinner className="h-3.5 w-3.5" aria-hidden="true" />
            Translating…
          </p>
        ) : (
          <p className="mt-1 text-base font-semibold text-rw-ink">{message.translatedText}</p>
        )}

        <div className="mt-2 flex items-center gap-2 text-xs text-rw-ink/50">
          <span className="rounded-full bg-rw-bg px-2 py-0.5">
            {LANG_LABEL[message.sourceLang]} → {LANG_LABEL[message.targetLang]}
          </span>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            type="button"
            onClick={replay}
            disabled={isPending}
            aria-label="Replay translation audio"
            className="ml-auto rounded-full p-1 text-rw-blue hover:bg-rw-blue/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {message.warnings?.map((warning, i) => (
          <p key={i} className="mt-1.5 flex items-start gap-1 text-xs text-amber-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{warning}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
