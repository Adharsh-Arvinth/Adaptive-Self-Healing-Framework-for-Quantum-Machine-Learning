"use client";

import React, { useState } from "react";
import {
  Sun,
  Moon,
  ExternalLink,
  Menu,
  X,
  Terminal,
} from "lucide-react";

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface HeaderProps {
  isConnected: boolean;
  pipelineState: string;
  stepCount: number;
  maxSteps: number;
  isRunning: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onResetPrompt: () => void;
  activeView: "landing" | "dashboard";
  onToggleView: (view: "landing" | "dashboard") => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  isDarkMode,
  onToggleTheme,
  activeView,
  onToggleView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Suggested primary navigation: Home | Framework | Technology | Research | Documentation | GitHub | Live Lab
  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "Framework", href: "#the-framework" },
    { label: "Technology", href: "#technology" },
    { label: "Research", href: "#research" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/90 border-b border-[var(--border-subtle)] transition-colors h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-full flex items-center justify-between gap-4">
        {/* Brand Lockup: Clean horizontal lockup with at most 2 intentional lines */}
        <div
          onClick={() => onToggleView("landing")}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          role="button"
          tabIndex={0}
          aria-label="Navigate to Home"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-mono font-bold text-[11px] shadow-sm group-hover:opacity-95 transition-opacity shrink-0">
            QML
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <span className="font-semibold text-xs sm:text-sm text-[var(--content-primary)] tracking-tight whitespace-nowrap">
              Adaptive Self-Healing VQC
            </span>
            <span className="text-[10px] font-mono text-[var(--content-secondary)] whitespace-nowrap">
              Autonomous Closed-Loop Runtime
            </span>
          </div>
        </div>

        {/* Primary Desktop Navigation: Compact, non-wrapping horizontal row */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs whitespace-nowrap">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                if (activeView === "dashboard") {
                  e.preventDefault();
                  onToggleView("landing");
                  setTimeout(() => {
                    const el = document.querySelector(link.href);
                    el?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1 font-medium"
            >
              {link.label}
            </a>
          ))}

          <a
            href="https://qml-backend-nczx.onrender.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1 flex items-center gap-1 font-medium"
          >
            <span>Docs</span>
            <ExternalLink className="w-3 h-3 text-[var(--content-secondary)]" />
          </a>

          <a
            href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1 flex items-center gap-1 font-medium"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Header Right Actions: Live Lab CTA & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Status Indicator Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-[var(--content-secondary)] font-medium">
              {isConnected ? "TELEMETRY LIVE" : "STANDBY"}
            </span>
          </div>

          {/* Live Lab View Toggle */}
          <button
            onClick={() => onToggleView(activeView === "dashboard" ? "landing" : "dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap ${
              activeView === "dashboard"
                ? "bg-[var(--accent)] text-white shadow-sm hover:opacity-90"
                : "bg-[var(--content-primary)] text-[var(--bg-primary)] hover:opacity-90 active:scale-95"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{activeView === "dashboard" ? "Landing Page" : "Live Lab"}</span>
          </button>

          {/* Compact Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:border-[var(--border-highlight)] transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors"
            aria-label="Open mobile navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Refined Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-2xl px-6 py-4 space-y-3 font-mono text-xs shadow-lg animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (activeView === "dashboard") {
                  e.preventDefault();
                  onToggleView("landing");
                  setTimeout(() => {
                    const el = document.querySelector(link.href);
                    el?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              className="block text-[var(--content-secondary)] hover:text-[var(--content-primary)] py-1.5 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://qml-backend-nczx.onrender.com/docs"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-[var(--content-secondary)] hover:text-[var(--content-primary)] py-1.5 transition-colors"
          >
            <span>Documentation (Swagger)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-[var(--content-secondary)] hover:text-[var(--content-primary)] py-1.5 transition-colors"
          >
            <span>GitHub Repository</span>
            <GithubIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </header>
  );
};
