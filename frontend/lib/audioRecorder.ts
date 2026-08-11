// Encapsulates getUserMedia/MediaRecorder lifecycle: permission handling, mime
// type negotiation, and a simple start()/stop() Promise-based API. Kept
// separate from any component so MicButton only has to care about the
// recording state machine, not browser audio API quirks.

const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export class MicPermissionError extends Error {
  constructor(message = "Microphone permission was denied.") {
    super(message);
    this.name = "MicPermissionError";
  }
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private mimeType: string;

  constructor() {
    this.mimeType = pickSupportedMimeType() ?? "audio/webm";
  }

  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof MediaRecorder !== "undefined"
    );
  }

  async start(): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      throw new Error("Audio recording is not supported in this browser.");
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      throw new MicPermissionError();
    }

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Recorder was not started."));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        this.cleanupStream();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.cleanupStream();
  }

  // Exposes the live MediaStream so a SilenceDetector can listen alongside
  // the MediaRecorder without renegotiating microphone permission.
  getStream(): MediaStream | null {
    return this.stream;
  }

  private cleanupStream(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}

// Watches a MediaStream's volume and fires once the user has spoken and then
// gone quiet for a bit — lets MicButton auto-stop and auto-submit a
// recording instead of requiring a second tap, like a real conversation
// where you just stop talking rather than pressing a button to hand off.
export interface SilenceDetectorOptions {
  /** RMS level (0-1) below which audio is considered silence. */
  volumeThreshold?: number;
  /** How long the signal must stay below threshold before firing, in ms. */
  silenceDurationMs?: number;
  /** Minimum time the user must have been speaking before silence counts. */
  minSpeechMs?: number;
}

export class SilenceDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private data: Uint8Array<ArrayBuffer>;
  private rafId: number | null = null;
  private hasSpoken = false;
  private silenceStartedAt: number | null = null;
  private readonly startedAt: number;
  private readonly volumeThreshold: number;
  private readonly silenceDurationMs: number;
  private readonly minSpeechMs: number;

  static isSupported(): boolean {
    return typeof window !== "undefined" && typeof AudioContext !== "undefined";
  }

  constructor(stream: MediaStream, private onSilence: () => void, options: SilenceDetectorOptions = {}) {
    this.volumeThreshold = options.volumeThreshold ?? 0.02;
    this.silenceDurationMs = options.silenceDurationMs ?? 1200;
    this.minSpeechMs = options.minSpeechMs ?? 400;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
    this.data = new Uint8Array(this.analyser.frequencyBinCount);

    this.startedAt = performance.now();
    this.tick();
  }

  private tick = (): void => {
    this.analyser.getByteTimeDomainData(this.data);

    let sumSquares = 0;
    for (let i = 0; i < this.data.length; i++) {
      const normalized = (this.data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.data.length);
    const now = performance.now();

    if (rms > this.volumeThreshold) {
      this.hasSpoken = true;
      this.silenceStartedAt = null;
    } else if (this.hasSpoken) {
      if (this.silenceStartedAt === null) this.silenceStartedAt = now;
      const silentFor = now - this.silenceStartedAt;
      const spokenLongEnough = now - this.startedAt >= this.minSpeechMs;
      if (silentFor >= this.silenceDurationMs && spokenLongEnough) {
        this.onSilence();
        return; // don't reschedule — caller stops the recorder from here
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.audioContext.close().catch(() => {});
  }
}
