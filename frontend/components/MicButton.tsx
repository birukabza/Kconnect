"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Mic, Square } from "lucide-react";

import { useConversationStore } from "@/lib/conversationStore";
import {
  AudioRecorder,
  MicPermissionError,
  SilenceDetector,
} from "@/lib/audioRecorder";
import { useConversePipeline } from "@/lib/useConversePipeline";
import { Spinner } from "./ui/Spinner";
import { Toast } from "./ui/Toast";

export function MicButton() {
  const status = useConversationStore((state) => state.status);
  const setStatus = useConversationStore((state) => state.setStatus);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoStopArmed, setAutoStopArmed] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const silenceDetectorRef = useRef<SilenceDetector | null>(null);

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

    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;

    setAutoStopArmed(false);

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
      silenceDetectorRef.current?.stop();
      silenceDetectorRef.current = null;

      recorderRef.current?.cancel();
      recorderRef.current = null;
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (status === "processing") {
      return;
    }

    if (status === "speaking") {
      window.speechSynthesis?.cancel();
      setStatus("idle");
      return;
    }

    if (status === "idle" || status === "error") {
      if (!recordingSupported) {
        showToast("Microphone recording isn't supported in this browser.");
        return;
      }

      try {
        const recorder = new AudioRecorder();

        recorderRef.current = recorder;

        await recorder.start();

        setStatus("listening");

        const stream = recorder.getStream();

        if (stream && SilenceDetector.isSupported()) {
          setAutoStopArmed(true);

          silenceDetectorRef.current = new SilenceDetector(
            stream,
            () => {
              void stopListening();
            }
          );
        }
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
    recordingSupported,
    setStatus,
    showToast,
    stopListening,
  ]);

  const label =
    status === "idle"
      ? "Tap to speak"
      : status === "listening"
        ? autoStopArmed
          ? "Listening…"
          : "Tap to stop"
        : status === "processing"
          ? "Translating…"
          : status === "speaking"
            ? "Speaking…"
            : "Try again";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "processing"}
        aria-pressed={status === "listening"}
        aria-label={label}
        className={clsx(
          "relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-transform",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-rw-yellow/60",
          "disabled:cursor-not-allowed disabled:opacity-80",
          status === "idle" && "bg-rw-blue hover:scale-105",
          status === "listening" && "bg-rw-blue",
          status === "processing" && "bg-rw-blue",
          status === "speaking" && "bg-rw-green",
          status === "error" && "bg-rose-600"
        )}
      >
        {status === "listening" && (
          <span
            className="absolute inset-0 rounded-full bg-rw-yellow motion-safe:animate-pulse-ring"
            aria-hidden="true"
          />
        )}

        <span className="relative z-10">
          {status === "processing" ? (
            <Spinner className="h-7 w-7" />
          ) : status === "listening" ? (
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

      <span className="text-xs font-medium text-rw-ink/60">
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