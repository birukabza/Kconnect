"use client";

import { ConversationBubble } from "@/components/ConversationBubble";
import { MicButton } from "@/components/MicButton";
import { useConversationStore } from "@/lib/conversationStore";

export default function Home() {
  const messages = useConversationStore((state) => state.messages);
  const status = useConversationStore((state) => state.status);

  const latestMessage = messages[messages.length - 1];

  const showBubble =
    latestMessage &&
    (latestMessage.status === "pending" ||
      latestMessage.status === "done") &&
    status !== "idle";

  return (
    <main className="flex min-h-dvh flex-col bg-rw-bg">
      <header className="flex items-center justify-center px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-rw-blue">
            KConnect
          </span>

          <span className="rounded-full bg-rw-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rw-ink">
            AI
          </span>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
        <div className="flex min-h-[220px] w-full max-w-md items-center justify-center">
          {showBubble ? (
            <ConversationBubble message={latestMessage} />
          ) : null}
        </div>

        <div className="mt-8">
          <MicButton />
        </div>
      </section>
    </main>
  );
}