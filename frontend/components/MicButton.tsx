"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Mic, Square, Volume2 } from "lucide-react";

import { useConversationStore } from "@/lib/conversationStore";
import {
  AudioRecorder,
  MicPermissionError,
} from "@/lib/audioRecorder";
import {
  stopBackendAudioPlayback,
  useConversePipeline,
} from "@/lib/useConversePipeline";
import { Spinner } from "./ui/Spinner";
import { Toast } from "./ui/Toast";

export function MicButton() {
  const status = useConversationStore((state) => state.status);
  const setStatus = useConversationStore((state) => state.setStatus);
  const direction = useConversationStore((state) => state.direction);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);

  const recordingSupported =
    typeof window !== "undefined" && AudioRecorder.isSupported();

  const showToast = useCallback(
    (message: string) => setToastMessage(message),
    []
  );

  const runPipeline = useConversePipeline(showToast);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const stopListening = useCallback(async () => {
    if (!recorderRef.current) return;

    const recorder = recorderRef.current;
    recorderRef.current = null;

    try {
      const blob = await recorder.stop();

      if (!blob.size) {
        setStatus("idle");
        showToast("No audio was recorded.");
        return;
      }

      await runPipeline({
        audioBlob: blob,
      });
    } catch (error) {
      setStatus("error");

      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong while recording."
      );

      setTimeout(() => {
        setStatus("idle");
      }, 1500);
    }
  }, [runPipeline, setStatus, showToast]);

  useEffect(() => {
    return () => {
      recorderRef.current?.cancel();
      recorderRef.current = null;
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (status === "processing") {
      return;
    }

    if (status === "speaking") {
      stopBackendAudioPlayback();
      window.speechSynthesis?.cancel();
      setStatus("idle");
      return;
    }

    if (status === "idle" || status === "error") {
      if (!direction) {
        showToast("Select a speech direction first.");
        return;
      }

      if (!recordingSupported) {
        showToast("Microphone recording isn't supported in this browser.");
        return;
      }

      try {
        const recorder = new AudioRecorder();

        recorderRef.current = recorder;

        await recorder.start();

        setStatus("listening");
      } catch (error) {
        recorderRef.current = null;

        if (error instanceof MicPermissionError) {
          showToast("Microphone permission was denied.");
        } else {
          showToast("Couldn't access the microphone.");
        }

        setStatus("idle");
      }

      return;
    }

    if (status === "listening") {
      await stopListening();
    }
  }, [
    status,
    direction,
    recordingSupported,
    setStatus,
    showToast,
    stopListening,
  ]);

  const label =
    !direction && status === "idle"
      ? "Select direction"
      : status === "idle"
      ? "Tap to speak"
      : status === "listening"
        ? "Tap to stop"
        : status === "processing"
          ? "Thinking…"
          : status === "speaking"
            ? "Speaking…"
            : "Try again";

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";
  const isError = status === "error";
  const waitingForDirection = !direction && status === "idle";

  return (
    <div className="flex flex-col items-center gap-3">
      <style jsx>{`
        @keyframes micPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.25;
          }

          50% {
            transform: scale(1.18);
            opacity: 0;
          }
        }

        @keyframes micPulseInner {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.1);
            opacity: 0;
          }
        }

        @keyframes micFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes speakingPulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.05);
          }
        }

        .mic-pulse {
          animation: micPulse 1.8s ease-out infinite;
        }

        .mic-pulse-inner {
          animation: micPulseInner 1.4s ease-out infinite;
        }

        .mic-listening-icon {
          animation: micFloat 0.9s ease-in-out infinite;
        }

        .mic-speaking {
          animation: speakingPulse 0.9s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .mic-pulse,
          .mic-pulse-inner,
          .mic-listening-icon,
          .mic-speaking {
            animation: none;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing || waitingForDirection}
        aria-pressed={isListening}
        aria-label={label}
        className={clsx(
          "relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-rw-yellow/60",
          "disabled:cursor-not-allowed disabled:opacity-90",
          "active:scale-95",
          !isListening &&
            !isProcessing &&
            !isSpeaking &&
            !isError &&
            "hover:scale-105",
          isListening && "bg-rw-blue",
          isProcessing && "bg-rw-blue",
          isSpeaking && "bg-rw-green",
          status === "idle" && "bg-rw-blue",
          waitingForDirection && "bg-rw-ink/25 shadow-none",
          isError && "bg-rose-600",
          isSpeaking && "mic-speaking"
        )}
      >
        {/* Outer listening pulse */}
        {isListening && (
          <>
            <span
              className="mic-pulse absolute inset-0 rounded-full bg-rw-yellow"
              aria-hidden="true"
            />

            <span
              className="mic-pulse-inner absolute inset-0 rounded-full bg-rw-yellow"
              aria-hidden="true"
            />
          </>
        )}

        {/* Inner button glow */}
        {isListening && (
          <span
            className="absolute inset-1 rounded-full border-2 border-rw-yellow/60"
            aria-hidden="true"
          />
        )}

        <span
          className={clsx(
            "relative z-10 flex items-center justify-center",
            isListening && "mic-listening-icon"
          )}
        >
          {isProcessing ? (
            <Spinner className="h-7 w-7" />
          ) : isSpeaking ? (
            <Volume2 className="h-7 w-7" aria-hidden="true" />
          ) : isListening ? (
            <Square
              className="h-6 w-6"
              aria-hidden="true"
              fill="currentColor"
            />
          ) : (
            <Mic className="h-7 w-7" aria-hidden="true" />
          )}
        </span>
      </button>

      <span
        className={clsx(
          "text-xs font-medium transition-colors duration-200",
          isListening && "text-rw-blue",
          isProcessing && "text-rw-ink/60",
          isSpeaking && "text-rw-green",
          isError && "text-rose-600",
          waitingForDirection && "text-rw-ink/40",
          status === "idle" &&
            !waitingForDirection &&
            "text-rw-ink/60"
        )}
      >
        {label}
      </span>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
