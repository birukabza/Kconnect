"use client";

import { useEffect, useState } from "react";

import { ConversationBubble } from "@/components/ConversationBubble";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MicButton } from "@/components/MicButton";
import { useConversationStore } from "@/lib/conversationStore";

export default function Home() {
  const messages = useConversationStore((state) => state.messages);
  const status = useConversationStore((state) => state.status);
  const direction = useConversationStore((state) => state.direction);

  const [isWaving, setIsWaving] = useState(false);

  const latestMessage = messages[messages.length - 1];

  const showBubble =
    latestMessage &&
    (latestMessage.status === "pending" ||
      latestMessage.status === "done") &&
    status !== "idle";

  const characterState =
    status === "listening"
      ? "listening"
      : status === "processing"
        ? "thinking"
        : status === "speaking"
          ? "speaking"
          : "idle";

  const showReadyCue =
    status === "idle" &&
    messages.length === 0 &&
    direction !== null;

  /*
   * Random idle waving.
   *
   * The character waits a random amount of time between
   * 10 and 30 seconds before waving.
   *
   * After each wave, another random delay is selected.
   *
   * Waving stops whenever the character becomes active.
   */
  useEffect(() => {
    if (characterState !== "idle") {
      setIsWaving(false);
      return;
    }

    let waveTimer: ReturnType<typeof setTimeout> | null = null;
    let stopWaveTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleWave = () => {
      const delay =
        Math.floor(
          Math.random() * (7000 - 3000 + 1)
        ) + 3000;

      waveTimer = setTimeout(() => {
        setIsWaving(true);

        /*
         * Keep the wave short.
         */
        stopWaveTimer = setTimeout(() => {
          setIsWaving(false);
          scheduleWave();
        }, 900);
      }, delay);
    };

    scheduleWave();

    return () => {
      if (waveTimer) {
        clearTimeout(waveTimer);
      }

      if (stopWaveTimer) {
        clearTimeout(stopWaveTimer);
      }

      setIsWaving(false);
    };
  }, [characterState]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-rw-bg">
      <style jsx>{`
        @keyframes kconnectFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes kconnectListen {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }

          50% {
            transform: translateY(-3px) rotate(-2deg) scale(1.025);
          }
        }

        @keyframes kconnectThink {
          0%,
          100% {
            transform: rotate(-3deg) translateY(0);
          }

          50% {
            transform: rotate(3deg) translateY(-3px);
          }
        }

        @keyframes kconnectTalk {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }

          25% {
            transform: translateY(-3px) scale(1.02);
          }

          50% {
            transform: translateY(0) scale(0.98);
          }

          75% {
            transform: translateY(-2px) scale(1.01);
          }
        }

        @keyframes kconnectBlink {
          0%,
          44%,
          48%,
          100% {
            transform: scaleY(1);
          }

          46% {
            transform: scaleY(0.12);
          }
        }

        /*
         * Short one-time wave.
         *
         * JavaScript decides WHEN the wave happens.
         * This animation decides HOW the arm moves.
         */
        @keyframes kconnectWave {
          0% {
            transform: rotate(0deg);
          }

          20% {
            transform: rotate(-22deg);
          }

          40% {
            transform: rotate(14deg);
          }

          60% {
            transform: rotate(-18deg);
          }

          80% {
            transform: rotate(10deg);
          }

          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes kconnectDot {
          0%,
          80%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }

          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        @keyframes kconnectReady {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 0.75;
          }
        }

        .kconnect-character {
          animation: kconnectFloat 3.4s ease-in-out infinite;
        }

        .kconnect-character.listening {
          animation: kconnectListen 1.5s ease-in-out infinite;
        }

        .kconnect-character.thinking {
          animation: kconnectThink 1.2s ease-in-out infinite;
        }

        .kconnect-character.speaking {
          animation: kconnectTalk 0.8s ease-in-out infinite;
        }

        .kconnect-eye {
          transform-origin: center;
          animation: kconnectBlink 5s ease-in-out infinite;
        }

        /*
         * The visible arm and hand are grouped together and
         * rotated around the shoulder.
         */
        .kconnect-wave {
          transform-box: view-box;
          transform-origin: 81px 76px;
          animation: kconnectWave 0.9s ease-in-out;
        }

        .kconnect-dot {
          animation: kconnectDot 1.2s ease-in-out infinite;
        }

        .kconnect-ready {
          animation: kconnectReady 2s ease-in-out infinite;
        }

        .kconnect-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .kconnect-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @media (prefers-reduced-motion: reduce) {
          .kconnect-character,
          .kconnect-character.listening,
          .kconnect-character.thinking,
          .kconnect-character.speaking,
          .kconnect-eye,
          .kconnect-wave,
          .kconnect-dot,
          .kconnect-ready {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-center px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-rw-blue">
            KConnect
          </span>

          <span className="rounded-full bg-rw-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rw-ink">
            AI
          </span>
        </div>
      </header>

      <LanguageToggle />

      {/* Main conversation area */}
      <section className="relative flex flex-1 items-center justify-center px-5 pb-10">
        {/*
         * Fixed center anchor.
         *
         * The anchor controls the character's position.
         * The character itself can animate without moving away
         * from the center of the screen.
         */}
        <div className="absolute left-1/2 top-1/2 z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
          {/* Animated character */}
          <div
            className={`kconnect-character relative h-28 w-28 ${
              characterState === "listening"
                ? "listening"
                : characterState === "thinking"
                  ? "thinking"
                  : characterState === "speaking"
                    ? "speaking"
                    : ""
            }`}
            aria-hidden="true"
          >
            <div className="relative h-28 w-28">
              {/* Soft background */}
              <div className="absolute inset-1 rounded-full bg-white/80 shadow-sm" />

              <svg
                viewBox="0 0 120 120"
                className="relative h-full w-full"
                fill="none"
              >
                {/* Body */}
                <path
                  d="M39 76C39 67.2 46.2 60 55 60H65C73.8 60 81 67.2 81 76V91H39V76Z"
                  fill="currentColor"
                  className="text-rw-blue"
                />

                {/* Head */}
                <rect
                  x="25"
                  y="22"
                  width="70"
                  height="56"
                  rx="27"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-rw-blue"
                />

                {/* Left antenna */}
                <path
                  d="M42 22V14"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-rw-blue"
                />

                <circle
                  cx="42"
                  cy="11"
                  r="4"
                  fill="currentColor"
                  className="text-rw-yellow"
                />

                {/* Right antenna */}
                <path
                  d="M78 22V14"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-rw-blue"
                />

                <circle
                  cx="78"
                  cy="11"
                  r="4"
                  fill="currentColor"
                  className="text-rw-yellow"
                />

                {/* Eyes */}
                <ellipse
                  cx="46"
                  cy="48"
                  rx="4"
                  ry="5"
                  fill="currentColor"
                  className="kconnect-eye text-rw-ink"
                />

                <ellipse
                  cx="74"
                  cy="48"
                  rx="4"
                  ry="5"
                  fill="currentColor"
                  className="kconnect-eye text-rw-ink"
                />

                {/* Smile */}
                <path
                  d="M48 61C53 67 67 67 72 61"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-rw-ink"
                />

                {/* Left arm */}
                <path
                  d="M39 76C32 75 27 79 25 86"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="text-rw-blue"
                />

                {/* Right arm + hand */}
                <g
                  className={isWaving ? "kconnect-wave" : undefined}
                >
                  <path
                    d="M81 76C88 75 94 69 95 61"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="text-rw-blue"
                  />

                  <circle
                    cx="95"
                    cy="59"
                    r="5"
                    fill="currentColor"
                    className="text-rw-yellow"
                  />
                </g>
              </svg>

              {/* Thinking dots */}
              {characterState === "thinking" && (
                <div className="absolute -right-8 top-2 flex items-end gap-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <span className="kconnect-dot h-1.5 w-1.5 rounded-full bg-rw-ink/40" />
                  <span className="kconnect-dot h-1.5 w-1.5 rounded-full bg-rw-ink/40" />
                  <span className="kconnect-dot h-1.5 w-1.5 rounded-full bg-rw-ink/40" />
                </div>
              )}
            </div>
          </div>

          {/* Translation bubble */}
          {showBubble && (
            <div className="absolute left-full top-1/2 z-20 ml-4 w-[170px] -translate-y-1/2 sm:w-[190px]">
              <ConversationBubble message={latestMessage} />
            </div>
          )}

          {/* Your turn cue */}
          {showReadyCue && (
            <div className="kconnect-ready absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium tracking-wide text-rw-ink/40">
              Your turn
            </div>
          )}
        </div>
      </section>

      {/* Microphone — remains bottom center */}
      <div className="absolute bottom-10 left-1/2 z-30 -translate-x-1/2">
        <MicButton />
      </div>
    </main>
  );
}
