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
          obsidian: "#090A0C",
          carbon: "#111317",
          surface: "#181B20",
          border: "rgba(255, 255, 255, 0.08)",
          text: "#F3EFE6",
          muted: "#9E998F",
          accent: "#3B82F6",
          indigo: "#4F46E5",
          crimson: "#E11D48",
          amber: "#D97706",
          emerald: "#10B981",
        },
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["Plus Jakarta Sans", "SF Pro Display", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
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
