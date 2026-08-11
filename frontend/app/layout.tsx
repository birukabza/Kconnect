import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KConnect AI — Speak freely in Rwanda",
  description:
    "KConnect AI is an AI companion that translates spoken English and Kinyarwanda in real time, so language is never a barrier in Rwanda.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-rw-bg text-rw-ink antialiased">{children}</body>
    </html>
  );
}
