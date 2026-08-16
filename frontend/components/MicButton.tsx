"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Mic, RotateCcw, Square, Volume2 } from "lucide-react";

import { AudioRecorder, MicPermissionError } from "@/lib/audioRecorder";
import { useConversationStore } from "@/lib/conversationStore";
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
  const clearSession = useConversationStore((state) => state.clearSession);

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

    const timer = setTimeout(() => setToastMessage(null), 4000);
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

      await runPipeline({ audioBlob: blob });
    } catch (error) {
      setStatus("error");
      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong while recording."
      );

      setTimeout(() => setStatus("idle"), 1500);
    }
  }, [runPipeline, setStatus, showToast]);

  useEffect(() => {
    return () => {
      recorderRef.current?.cancel();
      recorderRef.current = null;
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (status === "processing") return;

    if (status === "speaking") {
      stopBackendAudioPlayback();
      window.speechSynthesis?.cancel();
      setStatus("idle");
      return;
    }

    if (status === "idle" || status === "error") {
      if (!direction) {
        showToast("Choose a language channel first.");
        return;
      }

      if (!recordingSupported) {
        showToast("Microphone recording is not supported in this browser.");
        return;
      }

      try {
        const recorder = new AudioRecorder();
        recorderRef.current = recorder;
        await recorder.start();
        clearSession();
        setStatus("listening");
      } catch (error) {
        recorderRef.current = null;

        showToast(
          error instanceof MicPermissionError
            ? "Microphone permission was denied."
            : "Could not access the microphone."
        );
        setStatus("idle");
      }

      return;
    }

    if (status === "listening") {
      await stopListening();
    }
  }, [
    clearSession,
    direction,
    recordingSupported,
    setStatus,
    showToast,
    status,
    stopListening,
  ]);

  const waitingForDirection = !direction && status === "idle";
  const label = waitingForDirection
    ? "Choose channel"
    : status === "idle"
      ? "Tap to speak"
      : status === "listening"
        ? "Tap to stop"
        : status === "processing"
          ? "Translating"
          : status === "speaking"
            ? "Stop audio"
            : "Try again";

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";
  const isError = status === "error";

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing || waitingForDirection}
        aria-pressed={isListening}
        aria-label={label}
        className={clsx(
          "relative flex h-[118px] w-[118px] shrink-0 flex-col items-center justify-center gap-2 rounded-full border-[6px] border-rw-paper px-2 text-white",
          "shadow-[0_10px_30px_rgba(20,33,29,0.18)] transition-[background-color,box-shadow,transform] duration-300",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-rw-yellow focus-visible:ring-offset-2",
          "active:scale-[0.97] disabled:cursor-not-allowed",
          "sm:h-[130px] sm:w-[130px]",
          waitingForDirection && "bg-[#A7B5AF] shadow-[0_8px_20px_rgba(20,33,29,0.12)]",
          status === "idle" && direction && "bg-rw-blue hover:bg-[#1158B5]",
          isListening && "mic-listening bg-rw-green",
          isProcessing && "bg-rw-ink",
          isSpeaking && "bg-rw-coral hover:bg-[#D85649]",
          isError && "bg-rose-600 hover:bg-rose-700"
        )}
      >
        <span className="flex h-9 items-center justify-center" aria-hidden="true">
          {isProcessing ? (
            <Spinner className="h-7 w-7" />
          ) : isSpeaking ? (
            <Volume2 className="h-8 w-8" />
          ) : isListening ? (
            <Square className="h-7 w-7" fill="currentColor" />
          ) : isError ? (
            <RotateCcw className="h-7 w-7" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </span>

        <span className="max-w-[90px] text-center text-[11px] font-bold leading-tight sm:text-xs">
          {label}
        </span>
      </button>

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
