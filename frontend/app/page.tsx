/*
 * IMPECCABLE DIRECTION CONTRACT
 * SEED: b45ece95.
 * THESIS: A shared translation counter, not a chat feed or mascot stage.
 * OWN-WORLD: Mineral paper, cool counter enamel, forest ink, one blue exchange route, controlled yellow, coral live signal.
 * STORY: Choose a channel, speak from Side 1, hear Side 2, receive a grounded Local note only when useful.
 * FIRST VIEWPORT: Brand and account above two explicit channels; one two-sided counter fills the workspace; the microphone sits on its central exchange track.
 * FORM: Kigali Exchange Desk, grounded candidate 6 selected by the direction roll.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
 */

"use client";

import clsx from "clsx";

import { AccountMenu } from "@/components/AccountMenu";
import { AuthGate } from "@/components/AuthGate";
import { BrandMark } from "@/components/BrandMark";
import { ConversationBubble } from "@/components/ConversationBubble";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MicButton } from "@/components/MicButton";
import { useConversationStore } from "@/lib/conversationStore";

function ConversationExperience() {
  const messages = useConversationStore((state) => state.messages);
  const status = useConversationStore((state) => state.status);
  const direction = useConversationStore((state) => state.direction);

  const latestMessage = messages[messages.length - 1];
  const exchangeActive =
    status === "listening" ||
    status === "processing" ||
    status === "speaking";

  return (
    <main className="min-h-dvh overflow-x-hidden bg-rw-bg">
      <header className="border-b border-rw-line bg-rw-paper">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandMark />
          <AccountMenu />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-3 pb-5 pt-3 sm:px-6 sm:pb-8 sm:pt-5">
        <div className="mx-auto max-w-3xl">
          <LanguageToggle />
        </div>

        <section
          className="relative mt-3 overflow-hidden rounded-[10px] border border-rw-line bg-rw-paper shadow-[0_10px_32px_rgba(20,33,29,0.07)] sm:mt-5"
          aria-label="Live translation desk"
        >
          <ConversationBubble
            message={latestMessage}
            status={status}
            direction={direction}
          />

          <div
            className={clsx(
              "pointer-events-none absolute inset-x-0 top-1/2 z-20 h-12 -translate-y-1/2 bg-rw-blue lg:left-[41%] lg:right-[41%] lg:h-2",
              !direction && "bg-[#A7B5AF]"
            )}
            aria-hidden="true"
          >
            {exchangeActive && (
              <span className="exchange-dot absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-rw-yellow shadow-[0_0_0_4px_rgba(242,201,76,0.2)]" />
            )}
          </div>

          <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
            <MicButton />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <ConversationExperience />
    </AuthGate>
  );
}
