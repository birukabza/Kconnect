const TEMPORARY_CONVERSATION_KEY =
  "kconnect-temporary-conversation-id";


export function getTemporaryConversationId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(
      TEMPORARY_CONVERSATION_KEY
    );
  } catch {
    return null;
  }
}


export function setTemporaryConversationId(
  conversationId: string
): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      TEMPORARY_CONVERSATION_KEY,
      conversationId
    );
  } catch {
    // Translation still works when session storage is unavailable.
  }
}


export function clearTemporaryConversationId(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(
      TEMPORARY_CONVERSATION_KEY
    );
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
