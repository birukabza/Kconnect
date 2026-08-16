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
        "rw-blue": "#1769D2",
        "rw-yellow": "#F2C94C",
        "rw-green": "#0B4A39",
        "rw-coral": "#F16A5B",
        "rw-ink": "#14211D",
        "rw-muted": "#5D6D66",
        "rw-line": "#DCE5E1",
        "rw-bg": "#F4F7F5",
        "rw-paper": "#FCFDFC",
        "rw-cool": "#EDF5FB",
      },
    },
  },
  plugins: [],
};

export default config;
