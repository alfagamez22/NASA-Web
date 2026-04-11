import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/domains/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/infrastructure/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Anton", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Dark Theme (NASA)
        "nasa-dark": "#0a1428",
        "nasa-darker": "#050a15",
        "nasa-blue": "#1a3a52",
        "nasa-cyan": "#00d4ff",
        "nasa-light-cyan": "#00e8ff",
        "nasa-gray": "#c0b0a0",
        "nasa-light-gray": "#e8dcc8",

        // Light Theme Colors
        "light-bg": "#f8fafc",
        "light-bg-secondary": "#e0f2fe",
        "light-blue": "#0369a1",
        "light-cyan": "#06b6d4",
        "light-text": "#1e293b",
        "light-text-secondary": "#64748b",

        "brutal-black": "#000000",
        "brutal-white": "#ffffff",
      },
      boxShadow: {
        "nasa-glow": "0 0 10px rgba(0, 212, 255, 0.3)",
        "nasa-glow-intense": "0 0 20px rgba(0, 212, 255, 0.5)",
        "nasa-glow-xl": "0 0 30px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1)",
        "light-glow": "0 0 10px rgba(6, 182, 212, 0.2)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)" },
        },
        pulse_glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        glow: "glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        pulse_glow: "pulse_glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
