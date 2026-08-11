"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Mic, Square, Volume2 } from "lucide-react";
import { useConversationStore } from "@/lib/conversationStore";
import { AudioRecorder, MicPermissionError, SilenceDetector } from "@/lib/audioRecorder";
import { LiveTranscriber } from "@/lib/speechRecognition";
import { detectLanguage } from "@/lib/detectLanguage";
import { useConversePipeline } from "@/lib/useConversePipeline";
import { Spinner } from "./ui/Spinner";
import { Toast } from "./ui/Toast";

export function MicButton() {
  const status = useConversationStore((s) => s.status);
  const setStatus = useConversationStore((s) => s.setStatus);
  const direction = useConversationStore((s) => s.direction);
  const setDirection = useConversationStore((s) => s.setDirection);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoStopArmed, setAutoStopArmed] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const silenceDetectorRef = useRef<SilenceDetector | null>(null);
  const transcriberRef = useRef<LiveTranscriber | null>(null);
  const recordingSupported = typeof window !== "undefined" && AudioRecorder.isSupported();

  const showToast = useCallback((message: string) => setToastMessage(message), []);
  const runPipeline = useConversePipeline(showToast);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Shared by the manual tap-to-stop path and the silence detector below —
  // whichever fires first wins; the recorderRef.current === null check makes
  // the other a no-op instead of double-submitting.
  const stopListening = useCallback(async () => {
    if (!recorderRef.current) return;
    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;
    setAutoStopArmed(false);
    const recorder = recorderRef.current;
    recorderRef.current = null;

    const transcript = transcriberRef.current?.stop() ?? "";
    transcriberRef.current = null;
    const blob = await recorder.stop();

    // If the browser gave us a real transcript AND it confidently reads as
    // English, use it — that fixes "spoke English twice in a row", since
    // we're detecting the actual words said instead of just alternating.
    // Anything else (no transcript, unsupported browser, or — since no
    // browser recognizes Kinyarwanda speech — the Kinyarwanda side
    // entirely) falls back to the existing alternation guess.
    if (transcript && detectLanguage(transcript) === "en") {
      if (direction !== "en-to-rw") setDirection("en-to-rw");
      await runPipeline({ text: transcript, direction: "en-to-rw" });
    } else {
      await runPipeline({ audioBlob: blob });
    }
  }, [runPipeline, direction, setDirection]);

  useEffect(() => {
    // Clean up an in-progress recording/listener if the component unmounts
    // mid-recording (e.g. navigation away).
    return () => {
      silenceDetectorRef.current?.stop();
      transcriberRef.current?.stop();
      recorderRef.current?.cancel();
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (status === "speaking") {
      window.speechSynthesis?.cancel();
      setStatus("idle");
      return;
    }

    if (status === "processing") return; // ignore taps mid-flight

    if (status === "idle" || status === "error") {
      if (!recordingSupported) {
        showToast("Microphone recording isn't supported in this browser — try typing instead.");
        return;
      }
      try {
        const recorder = new AudioRecorder();
        recorderRef.current = recorder;
        await recorder.start();
        setStatus("listening");

        // Auto-stop once the user has spoken and then paused — no second tap
        // needed, like handing off in a real conversation. Tapping still
        // works as a manual override if VAD isn't supported or misfires.
        const stream = recorder.getStream();
        if (stream && SilenceDetector.isSupported()) {
          setAutoStopArmed(true);
          silenceDetectorRef.current = new SilenceDetector(stream, () => {
            stopListening();
          });
        }

        // Best-effort real transcript in parallel with the recording — see
        // lib/speechRecognition.ts for why this only ever attempts English.
        if (LiveTranscriber.isSupported()) {
          try {
            transcriberRef.current = new LiveTranscriber();
          } catch {
            transcriberRef.current = null;
          }
        }
      } catch (err) {
        if (err instanceof MicPermissionError) {
          showToast("Microphone permission denied — you can still type below.");
        } else {
          showToast("Couldn't access the microphone — you can still type below.");
        }
        setStatus("idle");
      }
      return;
    }

    if (status === "listening") {
      await stopListening();
    }
  }, [status, recordingSupported, setStatus, showToast, stopListening]);

  const label =
    status === "idle"
      ? "Tap to speak"
      : status === "listening"
      ? autoStopArmed
        ? "Listening… pause to send, or tap to stop"
        : "Listening… tap to stop"
      : status === "processing"
      ? "Translating…"
      : status === "speaking"
      ? "Playing… tap to stop"
      : "Something went wrong";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "processing"}
        aria-pressed={status === "listening"}
        aria-label={label}
        className={clsx(
          "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-rw-yellow/60 sm:h-20 sm:w-20",
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
            className="absolute inset-0 rounded-full bg-rw-yellow motion-reduce:animate-none motion-safe:animate-pulse-ring"
            aria-hidden="true"
          />
        )}
        <span className="relative z-10">
          {status === "processing" ? (
            <Spinner className="h-7 w-7" />
          ) : status === "listening" ? (
            <Square className="h-6 w-6" aria-hidden="true" fill="currentColor" />
          ) : status === "speaking" ? (
            <Volume2 className="h-7 w-7 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <Mic className="h-7 w-7" aria-hidden="true" />
          )}
        </span>
      </button>
      <span className="text-xs font-medium text-rw-ink/70">{label}</span>
      {status === "idle" && (
        // Audio has no way to detect language from (mock) content the way
        // typed text does, so it relies on conversation-mode's auto-flip
        // expectation — surface it here so it's obvious what will happen
        // without requiring a toggle tap first. The header toggle can still
        // override this if the alternation guessed wrong.
        <span className="text-[11px] text-rw-ink/40">
          Expecting {direction === "en-to-rw" ? "English" : "Kinyarwanda"}
        </span>
      )}
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </div>
  );
}
