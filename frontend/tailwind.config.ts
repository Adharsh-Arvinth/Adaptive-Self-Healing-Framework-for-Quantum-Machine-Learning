import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          subtle: "var(--bg-subtle)",
        },
        border: {
          subtle: "var(--border-subtle)",
          highlight: "var(--border-highlight)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
        },
        status: {
          success: "var(--status-success)",
          "success-subtle": "var(--status-success-subtle)",
          warning: "var(--status-warning)",
          "warning-subtle": "var(--status-warning-subtle)",
          danger: "var(--status-danger)",
          "danger-subtle": "var(--status-danger-subtle)",
          info: "var(--status-info)",
          "info-subtle": "var(--status-info-subtle)",
          ansatz: "var(--status-ansatz)",
          "ansatz-subtle": "var(--status-ansatz-subtle)",
          purity: "var(--status-purity)",
          "purity-subtle": "var(--status-purity-subtle)",
        },
        brand: {
          obsidian: "#141312",
          carbon: "#1C1A18",
          surface: "#24221F",
          border: "rgba(240, 230, 215, 0.08)",
          text: "#EDE7DE",
          muted: "#A6A094",
          accent: "#8C5338",
          indigo: "#4A6072",
          crimson: "#9E3D3D",
          amber: "#A36B2B",
          emerald: "#3D6B52",
        },
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro"',
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro"',
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        apple: "0 1px 2px 0 rgba(40, 30, 20, 0.04)",
        "apple-md": "0 4px 6px -1px rgba(40, 30, 20, 0.06), 0 2px 4px -2px rgba(40, 30, 20, 0.04)",
        "apple-lg": "0 12px 24px -4px rgba(40, 30, 20, 0.08), 0 4px 6px -2px rgba(40, 30, 20, 0.03)",
        "apple-dark": "0 8px 32px 0 rgba(10, 9, 8, 0.45)",
        cinematic: "0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
      borderRadius: {
        apple: "0.875rem",
        "apple-lg": "1.125rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "slide-down": "slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scan-line": "scanline 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
