"use client";

import clsx from "clsx";
import { Lightbulb, Radio } from "lucide-react";

import { Direction, Message, MicStatus } from "@/lib/types";
import { Spinner } from "./ui/Spinner";

const LANGUAGE_NAMES = {
  en: "English",
  rw: "Kinyarwanda",
} as const;

function SignalBars() {
  return (
    <span className="flex h-5 items-center gap-[3px]" aria-hidden="true">
      {[8, 15, 11, 19, 13, 17, 9].map((height, index) => (
        <span
          key={index}
          className="signal-bar block w-[3px] rounded-full bg-rw-coral"
          style={{
            height,
            animationDelay: `${index * 80}ms`,
          }}
        />
      ))}
    </span>
  );
}

export function ConversationBubble({
  message,
  status,
  direction,
}: {
  message?: Message;
  status: MicStatus;
  direction: Direction | null;
}) {
  const sourceName = direction
    ? LANGUAGE_NAMES[direction === "rw-to-en" ? "rw" : "en"]
    : "Not selected";
  const targetName = direction
    ? LANGUAGE_NAMES[direction === "rw-to-en" ? "en" : "rw"]
    : "Not selected";
  const hasTranslation = message?.status === "done" && !!message.translatedText;
  const isPending = status === "processing" || message?.status === "pending";
  const isError = status === "error" || message?.status === "error";

  const sourceText = isError
    ? "This turn could not be processed."
    : status === "listening"
      ? "Listening..."
      : isPending
        ? "Processing speech..."
        : hasTranslation
          ? message.sourceText
          : direction
            ? "Ready for Speaker 1"
            : "Choose a language channel";

  const translatedText = isError
    ? "Tap the microphone to try again."
    : isPending
      ? "Preparing translation..."
      : hasTranslation
        ? message.translatedText
        : direction
          ? "Ready for Speaker 2"
          : "Waiting";

  return (
    <div className="relative z-10 grid min-h-[500px] grid-rows-2 lg:min-h-[410px] lg:grid-cols-2 lg:grid-rows-1">
      <section className="flex min-w-0 flex-col justify-start bg-rw-paper px-5 pb-16 pt-7 sm:px-8 sm:pt-9 lg:px-10 lg:pb-8 lg:pr-24 lg:pt-14">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-rw-blue">
          <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-rw-blue text-white">
            1
          </span>
          <span>Speaker 1</span>
          <span className="text-rw-muted">{sourceName}</span>
        </div>

        <p
          className={clsx(
            "mt-5 max-w-[24ch] text-balance text-[1.45rem] font-semibold leading-[1.16] text-rw-ink sm:text-[1.8rem] lg:text-[2.15rem]",
            !hasTranslation && !isError && "text-rw-muted"
          )}
        >
          {sourceText}
        </p>

        {isPending && (
          <div
            className="mt-5 flex items-center gap-2 text-xs font-medium text-rw-muted"
            role="status"
          >
            <Spinner className="h-4 w-4 text-rw-blue" />
            <span>Speech received</span>
          </div>
        )}
      </section>

      <section
        className="flex min-w-0 flex-col bg-rw-cool px-5 pb-5 pt-16 sm:px-8 sm:pb-7 lg:px-10 lg:pb-8 lg:pl-24 lg:pt-14"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-rw-green">
          <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-rw-green text-white">
            2
          </span>
          <span>Speaker 2</span>
          <span className="text-rw-muted">{targetName}</span>
        </div>

        <p
          className={clsx(
            "mt-5 max-w-[24ch] text-balance text-[1.6rem] font-semibold leading-[1.12] text-rw-green sm:text-[2rem] lg:text-[2.5rem]",
            !hasTranslation && !isError && "text-rw-muted"
          )}
        >
          {translatedText}
        </p>

        {status === "speaking" && hasTranslation && (
          <div
            className="mt-5 flex items-center gap-3 text-xs font-semibold text-rw-coral"
            aria-label="Translation is playing"
          >
            <SignalBars />
            <span>Speaking</span>
          </div>
        )}

        {hasTranslation && message.culturalTip && (
          <aside
            className="local-note-enter mt-auto pt-6"
            aria-label="Local suggestion"
          >
            <div className="relative rounded-[8px] bg-[#FFF8D9] px-4 pb-4 pt-5 shadow-[0_8px_22px_rgba(20,33,29,0.08)]">
              <span
                className="absolute left-4 top-0 h-1 w-10 -translate-y-1/2 bg-rw-yellow"
                aria-hidden="true"
              />
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rw-yellow text-rw-green">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rw-green">Local note</p>
                  <p className="mt-1 text-sm leading-5 text-rw-ink">
                    {message.culturalTip}
                  </p>
                  {message.culturalSource && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rw-muted">
                      <Radio className="h-3 w-3" aria-hidden="true" />
                      <span className="truncate">{message.culturalSource}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}
