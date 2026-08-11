import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rwanda flag palette — semantic tokens so the whole app references
        // these names instead of hardcoded hex values.
        "rw-blue": "#00A1DE", // primary — buttons, mic active ring, links
        "rw-yellow": "#FAD201", // accent — highlights, active chip state (never as body text on white)
        "rw-green": "#20603D", // secondary/success — confirmations, translated-state indicators
        "rw-ink": "#1A1A1A", // body text
        "rw-bg": "#F7F7F5", // page background
      },
      animation: {
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
