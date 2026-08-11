import { Message } from "./types";

function formatLine(message: Message): string {
  const sourceLabel = message.sourceLang.toUpperCase();
  const targetLabel = message.targetLang.toUpperCase();
  return `${sourceLabel}: ${message.sourceText}\n${targetLabel}: ${message.translatedText}`;
}

export function formatTranscript(messages: Message[]): string {
  return messages.map(formatLine).join("\n\n");
}

export async function copyTranscript(messages: Message[]): Promise<void> {
  const text = formatTranscript(messages);
  await navigator.clipboard.writeText(text);
}

export function downloadTranscript(messages: Message[], filename = "kconnect-conversation.txt"): void {
  const text = formatTranscript(messages);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTranscriptJson(messages: Message[], filename = "kconnect-conversation.json"): void {
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
