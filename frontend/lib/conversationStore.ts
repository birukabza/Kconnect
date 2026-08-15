import { create } from "zustand";
import { Direction, MicStatus, Message } from "./types";

interface ConversationState {
  messages: Message[];
  direction: Direction | null;
  status: MicStatus;
  errorMessage: string | null;

  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;

  setDirection: (direction: Direction) => void;

  setStatus: (status: MicStatus) => void;
  setError: (message: string | null) => void;

  clearSession: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  direction: null,
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
}));
