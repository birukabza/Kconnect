"use client";

import clsx from "clsx";
import { ArrowRight } from "lucide-react";

import { useConversationStore } from "@/lib/conversationStore";
import { Direction } from "@/lib/types";

const OPTIONS: Array<{
  value: Direction;
  number: string;
  sourceCode: string;
  sourceLabel: string;
  targetCode: string;
  targetLabel: string;
}> = [
  {
    value: "en-to-rw",
    number: "1",
    sourceCode: "EN",
    sourceLabel: "English",
    targetCode: "RW",
    targetLabel: "Kinyarwanda",
  },
  {
    value: "rw-to-en",
    number: "2",
    sourceCode: "RW",
    sourceLabel: "Kinyarwanda",
    targetCode: "EN",
    targetLabel: "English",
  },
];

export function LanguageToggle() {
  const direction = useConversationStore((state) => state.direction);
  const setDirection = useConversationStore((state) => state.setDirection);
  const status = useConversationStore((state) => state.status);

  const disabled =
    status === "listening" ||
    status === "processing" ||
    status === "speaking";

  return (
    <section aria-label="Speech direction" className="w-full">
      <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:gap-3">
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
                "grid min-h-[68px] grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-[8px] border px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow,color] duration-200 sm:grid-cols-[36px_minmax(0,1fr)] sm:gap-3 sm:px-3",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-rw-blue focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-rw-blue bg-rw-cool text-rw-ink shadow-[0_5px_14px_rgba(23,105,210,0.1)]"
                  : "border-rw-line bg-rw-paper text-rw-muted hover:border-rw-green/35 hover:text-rw-ink"
              )}
            >
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-[6px] text-sm font-bold sm:h-9 sm:w-9",
                  selected
                    ? "bg-rw-blue text-white"
                    : "border border-rw-line bg-white text-rw-green"
                )}
                aria-hidden="true"
              >
                {option.number}
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[10px] font-bold text-rw-blue sm:text-[11px]">
                  <span>{option.sourceCode}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{option.targetCode}</span>
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-tight sm:text-xs">
                  {option.sourceLabel} to {option.targetLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
