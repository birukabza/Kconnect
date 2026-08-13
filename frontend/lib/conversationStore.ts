import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Direction, MicStatus, Message } from "./types";

interface ConversationState {
  messages: Message[];
  direction: Direction;
  status: MicStatus;
  errorMessage: string | null;

  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;

  setDirection: (direction: Direction) => void;

  setStatus: (status: MicStatus) => void;
  setError: (message: string | null) => void;

  clearSession: () => void;
  toggleDirection: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      messages: [],
      direction: "en-to-rw",
      status: "idle",
      errorMessage: null,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id
              ? { ...message, ...patch }
              : message
          ),
        })),

      setDirection: (direction) =>
        set({
          direction,
        }),

      toggleDirection: () =>
        set((state) => ({
          direction:
            state.direction === "en-to-rw"
              ? "rw-to-en"
              : "en-to-rw",
        })),

      setStatus: (status) =>
        set({
          status,
        }),

      setError: (errorMessage) =>
        set({
          errorMessage,
          status: errorMessage ? "error" : "idle",
        }),

      clearSession: () =>
        set({
          messages: [],
        }),
    }),
    {
      name: "kconnect-conversation",

      // Persist only conversation history and the expected direction.
      // Transient UI state starts fresh after a reload.
      partialize: (state) => ({
        messages: state.messages,
        direction: state.direction,
      }),
    }
  )
);