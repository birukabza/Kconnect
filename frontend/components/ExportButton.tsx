"use client";

import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { useConversationStore } from "@/lib/conversationStore";
import { copyTranscript, downloadTranscript } from "@/lib/exportTranscript";

export function ExportButton() {
  const messages = useConversationStore((s) => s.messages);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyTranscript(messages);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    downloadTranscript(messages);
  }

  const disabled = messages.length === 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-full border border-rw-blue/30 px-3 py-1.5 text-xs font-medium text-rw-ink transition-colors hover:bg-rw-blue/5 disabled:opacity-40"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-rw-green" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-full border border-rw-blue/30 px-3 py-1.5 text-xs font-medium text-rw-ink transition-colors hover:bg-rw-blue/5 disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Download
      </button>
    </div>
  );
}
