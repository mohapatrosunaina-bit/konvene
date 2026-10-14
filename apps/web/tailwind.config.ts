import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#F6F1E7",
        paperAlt: "#EEE6D6",
        paperDeep: "#E4D9C2",
        ink: "#15130F",
        inkSoft: "#4A443B",
        signal: {
          DEFAULT: "#FF4A1F",
          dark: "#D6350A",
        },
        cobalt: "#1F32E0",
        acid: "#D6FF3F",
        berry: "#D6336C",
        moss: "#1F6D4C",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        hard: "6px 6px 0 0 #15130F",
        "hard-sm": "3px 3px 0 0 #15130F",
        "hard-lg": "10px 10px 0 0 #15130F",
        "hard-signal": "6px 6px 0 0 #FF4A1F",
      },
      backgroundImage: {
        "dot-grid": "radial-gradient(rgba(21,19,15,0.14) 1.5px, transparent 1.5px)",
        noise: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        dots: "22px 22px",
      },
      animation: {
        marquee: "marquee 22s linear infinite",
        wiggle: "wiggle 4s ease-in-out infinite",
        "spin-slow": "spin 14s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
