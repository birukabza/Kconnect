import { useCallback } from "react";
import { useConversationStore } from "./conversationStore";
import { mockConverse, speak } from "./mockConverse";
import { Direction, Message } from "./types";

function langsForDirection(direction: Direction) {
  return direction === "en-to-rw"
    ? { source: "en" as const, target: "rw" as const }
    : { source: "rw" as const, target: "en" as const };
}

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
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Shared conversation pipeline.
//
// Audio input:
// Frontend → FastAPI → AI pipeline
//
// Text input:
// Continues using the existing mock until a text endpoint is added.
export function useConversePipeline(
  onWarning?: (message: string) => void
) {
  const direction = useConversationStore((s) => s.direction);
  const setStatus = useConversationStore((s) => s.setStatus);
  const addMessage = useConversationStore((s) => s.addMessage);
  const updateMessage = useConversationStore((s) => s.updateMessage);
  const setDirection = useConversationStore((s) => s.setDirection);
  const toggleDirection = useConversationStore((s) => s.toggleDirection);

  return useCallback(
    async (input: {
      audioBlob?: Blob;
      text?: string;
      direction?: Direction;
    }) => {
      const effectiveDirection = input.direction ?? direction;
      const { source, target } =
        langsForDirection(effectiveDirection);

      const inputType: Message["inputType"] = input.audioBlob
        ? "audio"
        : "text";

      const id = crypto.randomUUID();

      // Add the user's message immediately.
      addMessage({
        id,
        direction: effectiveDirection,
        inputType,
        sourceText:
          input.text ?? "Transcribing your voice…",
        sourceLang: source,
        translatedText: "",
        targetLang: target,
        createdAt: Date.now(),
        status: "pending",
      });

      setStatus("processing");

      try {
        /*
         * AUDIO INPUT
         *
         * Send the recorded audio to:
         *
         * POST /api/conversation
         *
         * The backend automatically handles language
         * detection and the AI pipeline.
         */
        if (input.audioBlob) {
          const formData = new FormData();

          const mimeType =
            input.audioBlob.type || "audio/webm";

          console.log(
            "Sending audio to backend:",
            {
              mimeType,
              size: input.audioBlob.size,
            }
          );

          /*
           * Choose a filename that matches the actual
           * MIME type as closely as possible.
           */
          let filename = "conversation.webm";

          if (mimeType.includes("wav")) {
            filename = "conversation.wav";
          } else if (mimeType.includes("mpeg")) {
            filename = "conversation.mp3";
          } else if (mimeType.includes("mp4")) {
            filename = "conversation.mp4";
          } else if (mimeType.includes("ogg")) {
            filename = "conversation.ogg";
          }

          formData.append(
            "audio",
            input.audioBlob,
            filename
          );

          const response = await fetch(
            `${API_URL}/api/conversation`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            let detail =
              `Audio processing failed (${response.status}).`;

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

          /*
           * The backend/AI detected the actual source
           * language.
           */
          const detectedDirection: Direction =
            result.detected_language === "en"
              ? "en-to-rw"
              : "rw-to-en";

          const detectedSource =
            result.detected_language;

          const detectedTarget =
            result.detected_language === "en"
              ? "rw"
              : "en";

          /*
           * Update the existing message with the real
           * backend result.
           */
          updateMessage(id, {
            direction: detectedDirection,
            sourceText: result.transcript,
            sourceLang: detectedSource,
            translatedText: result.translated_text,
            targetLang: detectedTarget,
            status: "done",
          });

          /*
           * Keep the frontend's direction state synchronized
           * with the language detected by the AI.
           *
           * This is only for compatibility with the current UI.
           * The AI remains responsible for actual language
           * detection.
           */
          setDirection(detectedDirection);

          /*
           * For now, use browser speech synthesis.
           *
           * Later, when translated_audio is implemented,
           * we can play the backend-generated audio directly.
           */
          setStatus("speaking");

          const { warning } = speak(
            result.translated_text,
            detectedTarget
          );

          if (warning) {
            onWarning?.(warning);
          }

          setTimeout(
            () => setStatus("idle"),
            1600
          );

          return;
        }

        /*
         * TEXT INPUT
         *
         * Keep the existing mock behavior temporarily.
         * The current FastAPI conversation endpoint accepts
         * audio only.
         */
        const mockResponse = await mockConverse({
          direction: effectiveDirection,
          text: input.text,
        });

        updateMessage(id, {
          sourceText: mockResponse.sourceText,
          translatedText: mockResponse.translatedText,
          warnings: mockResponse.warnings,
          status: "done",
        });

        setStatus("speaking");

        const { warning } = speak(
          mockResponse.translatedText,
          target
        );

        if (warning) {
          onWarning?.(warning);
        }

        toggleDirection();

        setTimeout(
          () => setStatus("idle"),
          1600
        );
      } catch (err) {
        updateMessage(id, {
          status: "error",
        });

        setStatus("error");

        onWarning?.(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );

        setTimeout(
          () => setStatus("idle"),
          1500
        );
      }
    },
    [
      direction,
      setStatus,
      addMessage,
      updateMessage,
      setDirection,
      toggleDirection,
      onWarning,
    ]
  );
}