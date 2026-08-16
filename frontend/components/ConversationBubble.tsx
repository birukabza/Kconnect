"use client";

import { Lightbulb } from "lucide-react";

import { Message } from "@/lib/types";
import { Spinner } from "./ui/Spinner";

export function ConversationBubble({
  message,
}: {
  message: Message;
}) {
  const isPending = message.status === "pending";

  return (
    <div className="w-full animate-[bubbleIn_350ms_ease-out]">
      <style jsx>{`
        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateX(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes bubbleIn {
            from,
            to {
              opacity: 1;
              transform: none;
            }
          }
        }
      `}</style>

      <div className="relative rounded-[24px] rounded-br-[7px] bg-white px-5 py-4 text-right shadow-[0_8px_30px_rgba(0,0,0,0.07)]">
        {/* Speech bubble tail */}
        <span
          className="absolute -bottom-2 right-4 h-5 w-5 rotate-45 bg-white"
          aria-hidden="true"
        />

        {/* Original spoken text — subtle */}
        {message.sourceText && message.sourceText !== "Listening…" && (
          <p className="relative text-[11px] italic leading-relaxed text-rw-ink/35">
            {message.sourceText}
          </p>
        )}

        {/* Translation */}
        {isPending ? (
          <div className="relative mt-1 flex items-center justify-end gap-2 text-sm text-rw-ink/45">
            <span>Translating</span>

            <Spinner className="h-3.5 w-3.5" />
          </div>
        ) : (
          <p className="relative mt-1 text-lg font-semibold leading-snug tracking-[-0.01em] text-rw-ink sm:text-xl">
            {message.translatedText}
          </p>
        )}

        {/* Small speaking indicator */}
        {!isPending && message.translatedText && (
          <div
            className="relative mt-2 flex justify-end"
            aria-label="Translation is being spoken"
          >
            <span className="flex items-end gap-[2px]">
              <span className="h-2 w-[2px] rounded-full bg-rw-blue/50 animate-pulse" />
              <span className="h-3 w-[2px] rounded-full bg-rw-blue/70 animate-pulse [animation-delay:100ms]" />
              <span className="h-4 w-[2px] rounded-full bg-rw-blue animate-pulse [animation-delay:200ms]" />
              <span className="h-3 w-[2px] rounded-full bg-rw-blue/70 animate-pulse [animation-delay:300ms]" />
              <span className="h-2 w-[2px] rounded-full bg-rw-blue/50 animate-pulse [animation-delay:400ms]" />
            </span>
          </div>
        )}

        {!isPending && message.culturalTip && (
          <div className="relative mt-3 border-t border-rw-ink/10 pt-3 text-left">
            <div className="flex items-start gap-2">
              <Lightbulb
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rw-yellow"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs leading-relaxed text-rw-ink/75">
                  {message.culturalTip}
                </p>

                {message.culturalSource && (
                  <p className="mt-1 text-[10px] leading-tight text-rw-ink/40">
                    {message.culturalSource}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
