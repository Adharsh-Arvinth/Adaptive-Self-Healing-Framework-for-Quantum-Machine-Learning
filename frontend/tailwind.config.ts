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
        // c-*: token colours that accept opacity modifiers (bg-c-ink/70)
        c: {
          "ink": "rgb(var(--rgb-ink) / <alpha-value>)",
          "paper": "rgb(var(--rgb-paper) / <alpha-value>)",
          "carbon": "rgb(var(--rgb-carbon) / <alpha-value>)",
          "signal": "rgb(var(--rgb-signal) / <alpha-value>)",
          "accent": "rgb(var(--rgb-accent) / <alpha-value>)",
          "status-danger": "rgb(var(--rgb-status-danger) / <alpha-value>)",
          "status-success": "rgb(var(--rgb-status-success) / <alpha-value>)",
          "status-warning": "rgb(var(--rgb-status-warning) / <alpha-value>)",
          "status-info": "rgb(var(--rgb-status-info) / <alpha-value>)",
          "status-purity": "rgb(var(--rgb-status-purity) / <alpha-value>)",
          "status-ansatz": "rgb(var(--rgb-status-ansatz) / <alpha-value>)",
          "bg-surface": "rgb(var(--rgb-bg-surface) / <alpha-value>)",
          "bg-surface-elevated": "rgb(var(--rgb-bg-surface-elevated) / <alpha-value>)",
          "bg-subtle": "rgb(var(--rgb-bg-subtle) / <alpha-value>)",
          "bg-primary": "rgb(var(--rgb-bg-primary) / <alpha-value>)",
        },
        bg: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          subtle: "var(--bg-subtle)",
          hover: "var(--bg-hover)",
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
          copper: "var(--accent-copper)",
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
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        apple: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "apple-md": "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        "apple-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      borderRadius: {
        apple: "0.75rem",
        "apple-lg": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
