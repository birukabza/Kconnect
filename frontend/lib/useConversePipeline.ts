import { useCallback } from "react";

import { useConversationStore } from "./conversationStore";
import { speak } from "./mockConverse";
import { Direction, Message } from "./types";

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
  translated_audio_mime_type?: string | null;
  intent?: BackendIntent | null;
  cultural_tip?: string | null;
  source?: string | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

let stopActiveBackendAudio: (() => void) | null = null;

export function stopBackendAudioPlayback() {
  stopActiveBackendAudio?.();
  stopActiveBackendAudio = null;
}

async function playBackendAudio(
  audioBase64: string,
  mimeType = "audio/mpeg"
): Promise<void> {
  if (typeof Audio === "undefined") {
    throw new Error("Audio playback is not supported in this browser.");
  }

  stopBackendAudioPlayback();

  const audio = new Audio(
    `data:${mimeType};base64,${audioBase64}`
  );

  const finished = new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = (error?: Error) => {
      if (settled) return;

      settled = true;
      stopActiveBackendAudio = null;

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    stopActiveBackendAudio = () => {
      audio.pause();
      audio.currentTime = 0;
      settle();
    };

    audio.onended = () => settle();
    audio.onerror = () =>
      settle(new Error("Synthesized audio playback failed."));
  });

  try {
    await audio.play();
    await finished;
  } catch (error) {
    stopBackendAudioPlayback();
    throw error;
  }
}

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

  const setDirection = useConversationStore(
    (state) => state.setDirection
  );

  const direction = useConversationStore(
    (state) => state.direction
  );

  const clearSession = useConversationStore(
    (state) => state.clearSession
  );

  return useCallback(
    async (input: { audioBlob: Blob }) => {
      const id = crypto.randomUUID();
      const initialSource =
        direction === "en-to-rw" ? "en" : "rw";
      const initialTarget =
        direction === "en-to-rw" ? "rw" : "en";

      /*
       * The current direction is the expected speaker handoff.
       * This initial direction is only used to satisfy the Message
       * shape while the request is being processed.
       */
      const message: Message = {
        id,
        direction,
        inputType: "audio",
        sourceText: "Listening…",
        sourceLang: initialSource,
        translatedText: "",
        targetLang: initialTarget,
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
        formData.append("direction", direction);

        console.log("Sending audio to backend:", {
          mimeType: input.audioBlob.type,
          size: input.audioBlob.size,
          direction,
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

        /*
         * The backend is the source of truth for the spoken language.
         */
        const detectedSource = result.detected_language;

        const detectedTarget =
          result.detected_language === "en"
            ? "rw"
            : "en";

        const detectedDirection: Direction =
          result.detected_language === "en"
            ? "en-to-rw"
            : "rw-to-en";

        /*
         * After this person speaks, the other person is expected
         * to respond in the translated language.
         *
         * Therefore:
         *
         * English speaker
         *   EN -> RW
         *   next expected turn: RW -> EN
         *
         * Kinyarwanda speaker
         *   RW -> EN
         *   next expected turn: EN -> RW
         */
        const nextDirection: Direction =
          detectedDirection === "en-to-rw"
            ? "rw-to-en"
            : "en-to-rw";

        updateMessage(id, {
          direction: detectedDirection,
          sourceText: result.transcript,
          sourceLang: detectedSource,
          translatedText: result.translated_text,
          targetLang: detectedTarget,
          status: "done",
        });

        /*
         * Store the direction expected for the next speaker.
         */
        setDirection(nextDirection);

        /*
         * The translation is now visible and being spoken.
         */
        setStatus("speaking");

        if (result.translated_audio) {
          try {
            await playBackendAudio(
              result.translated_audio,
              result.translated_audio_mime_type ?? "audio/mpeg"
            );
          } catch {
            onWarning?.(
              "Could not play synthesized audio; using browser speech instead."
            );

            const { warning, finished } = speak(
              result.translated_text,
              detectedTarget
            );

            if (warning) {
              onWarning?.(warning);
            }

            await finished;
          }
        } else {
          const { warning, finished } = speak(
            result.translated_text,
            detectedTarget
          );

          if (warning) {
            onWarning?.(warning);
          }

          await finished;
        }

        /*
         * Remove the temporary translation bubble and return
         * the interface to the ready state.
         */
        clearSession();
        setStatus("idle");
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
      setDirection,
      direction,
      clearSession,
      onWarning,
    ]
  );
}
