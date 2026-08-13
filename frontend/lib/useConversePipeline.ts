import { useCallback } from "react";

import { useConversationStore } from "./conversationStore";
import { speak } from "./mockConverse";
import { Message } from "./types";

interface BackendIntent {
  category?: string | null;
  sub_category?: string | null;
  situation?: string | null;
}

interface BackendConversationResponse {
  detected_language: "en" | "rw";
  transcript: string;
  translated_text: string;
  translated_audio?: string | null;
  intent?: BackendIntent | null;
  cultural_tip?: string | null;
  source?: string | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

export function useConversePipeline(
  onWarning?: (message: string) => void
) {
  const setStatus = useConversationStore(
    (state) => state.setStatus
  );

  const addMessage = useConversationStore(
    (state) => state.addMessage
  );

  const updateMessage = useConversationStore(
    (state) => state.updateMessage
  );

  const clearSession = useConversationStore(
    (state) => state.clearSession
  );

  return useCallback(
    async (input: { audioBlob: Blob }) => {
      const id = crypto.randomUUID();

      const message: Message = {
        id,
        direction: "en-to-rw",
        inputType: "audio",
        sourceText: "Listening…",
        sourceLang: "en",
        translatedText: "",
        targetLang: "rw",
        createdAt: Date.now(),
        status: "pending",
      };

      addMessage(message);
      setStatus("processing");

      try {
        const formData = new FormData();

        formData.append(
          "audio",
          input.audioBlob,
          "conversation.webm"
        );

        console.log("Sending audio to backend:", {
          mimeType: input.audioBlob.type,
          size: input.audioBlob.size,
        });

        const response = await fetch(
          `${API_URL}/api/conversation`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          let detail = "Audio processing failed.";

          try {
            const errorData = await response.json();

            if (errorData?.detail) {
              detail = errorData.detail;
            }
          } catch {
            // Keep the default error message.
          }

          throw new Error(detail);
        }

        const result =
          (await response.json()) as BackendConversationResponse;

        const detectedSource =
          result.detected_language;

        const detectedTarget =
          result.detected_language === "en"
            ? "rw"
            : "en";

        const detectedDirection =
          result.detected_language === "en"
            ? "en-to-rw"
            : "rw-to-en";

        updateMessage(id, {
          direction: detectedDirection,
          sourceText: result.transcript,
          sourceLang: detectedSource,
          translatedText: result.translated_text,
          targetLang: detectedTarget,
          status: "done",
        });

        setStatus("speaking");

        const { warning } = speak(
          result.translated_text,
          detectedTarget
        );

        if (warning) {
          onWarning?.(warning);
        }

        /*
         * Keep the translation visible while the response is being
         * spoken. Then clear it so the next person gets a clean screen.
         */
        setTimeout(() => {
          clearSession();
          setStatus("idle");
        }, 1600);
      } catch (error) {
        updateMessage(id, {
          status: "error",
        });

        setStatus("error");

        onWarning?.(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );

        setTimeout(() => {
          clearSession();
          setStatus("idle");
        }, 1500);
      }
    },
    [
      setStatus,
      addMessage,
      updateMessage,
      clearSession,
      onWarning,
    ]
  );
}