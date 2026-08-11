"use client";

import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { useConversationStore } from "@/lib/conversationStore";
import { ConversationBubble } from "./ConversationBubble";

export function ConversationList() {
  const messages = useConversationStore((s) => s.messages);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAtBottom]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceFromBottom < 80);
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-rw-ink/50">
        <Languages className="h-10 w-10 text-rw-blue/40" aria-hidden="true" />
        <p className="text-sm">
          Tap the microphone, type a message, or pick a quick phrase below to start translating.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
    >
      {messages.map((message) => (
        <ConversationBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
