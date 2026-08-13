"use client";

import clsx from "clsx";
import { ArrowRight, Check, Languages } from "lucide-react";

import { useConversationStore } from "@/lib/conversationStore";
import { Direction } from "@/lib/types";

const OPTIONS: Array<{
  value: Direction;
  sourceCode: string;
  sourceLabel: string;
  targetCode: string;
  targetLabel: string;
}> = [
  {
    value: "en-to-rw",
    sourceCode: "EN",
    sourceLabel: "English",
    targetCode: "RW",
    targetLabel: "Kinyarwanda",
  },
  {
    value: "rw-to-en",
    sourceCode: "RW",
    sourceLabel: "Kinyarwanda",
    targetCode: "EN",
    targetLabel: "English",
  },
];

export function LanguageToggle() {
  const direction = useConversationStore((state) => state.direction);
  const setDirection = useConversationStore(
    (state) => state.setDirection
  );
  const status = useConversationStore((state) => state.status);

  const disabled =
    status === "listening" ||
    status === "processing" ||
    status === "speaking";

  return (
    <section
      aria-label="Speech direction"
      className="relative z-20 mx-auto flex w-full max-w-md flex-col items-center gap-2 px-4"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-rw-ink/50">
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span>Speech direction</span>
      </div>

      <div
        role="radiogroup"
        className="grid w-full grid-cols-1 gap-2 rounded-[8px] border border-rw-blue/15 bg-white/75 p-1 shadow-sm sm:grid-cols-2"
      >
        {OPTIONS.map((option) => {
          const selected = direction === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => setDirection(option.value)}
              className={clsx(
                "flex min-h-14 items-center justify-between rounded-[6px] px-3 py-2 text-left transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-yellow",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "bg-rw-blue text-white shadow-sm"
                  : "bg-transparent text-rw-ink hover:bg-rw-blue/10"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-rw-blue">
                  {option.sourceCode}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {option.sourceLabel}
                  </span>
                  <span
                    className={clsx(
                      "mt-0.5 flex items-center gap-1 text-xs",
                      selected ? "text-white/80" : "text-rw-ink/50"
                    )}
                  >
                    <ArrowRight
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    {option.targetLabel}
                  </span>
                </span>
              </span>

              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  selected ? "bg-rw-yellow text-rw-ink" : "bg-rw-ink/5"
                )}
              >
                {selected && (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
