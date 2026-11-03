import type { Config } from "tailwindcss";

const appleFontStack = [
  "SF Pro Display",
  "SF Pro Text",
  "-apple-system",
  "BlinkMacSystemFont",
  "Helvetica Neue",
  "Helvetica",
  "Arial",
  "sans-serif",
];

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
        earth: {
          clay: "var(--accent-primary)",
          sage: "var(--status-success)",
          ochre: "var(--status-warning)",
          rust: "var(--status-danger)",
          slate: "var(--status-info)",
          heather: "var(--status-ansatz)",
          lichen: "var(--status-purity)",
        },
      },
      fontFamily: {
        sans: appleFontStack,
        mono: appleFontStack,
      },
      boxShadow: {
        apple: "0 1px 2px 0 rgba(40, 30, 20, 0.04)",
        "apple-md": "0 4px 6px -1px rgba(40, 30, 20, 0.06), 0 2px 4px -2px rgba(40, 30, 20, 0.04)",
        "apple-lg": "0 12px 24px -4px rgba(40, 30, 20, 0.08), 0 4px 6px -2px rgba(40, 30, 20, 0.03)",
        "apple-dark": "0 8px 32px 0 rgba(10, 9, 8, 0.45)",
      },
      borderRadius: {
        apple: "0.875rem",
        "apple-lg": "1.125rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-down": "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
