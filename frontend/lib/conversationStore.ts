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
        set((state) => ({ messages: [...state.messages, message] })),

      // Patches a message in place — used to fill in the real translation on
      // top of the optimistic bubble `addMessage` inserted immediately, so
      // the UI never waits on the pipeline to show *something*.
      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      setDirection: (direction) => set({ direction }),

      toggleDirection: () =>
        set((state) => ({
          direction: state.direction === "en-to-rw" ? "rw-to-en" : "en-to-rw",
        })),

      setStatus: (status) => set({ status }),

      setError: (errorMessage) => set({ errorMessage, status: errorMessage ? "error" : "idle" }),

      clearSession: () => set({ messages: [] }),
    }),
    {
      name: "kconnect-conversation",
      // Only persist the conversation history across reloads — transient UI
      // state (mic status, error banners) should always start fresh.
      partialize: (state) => ({ messages: state.messages, direction: state.direction }),
    }
  )
);
