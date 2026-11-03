"use client";

import React, { useState } from "react";
import {
  Sun,
  Moon,
  ExternalLink,
  Menu,
  X,
  Terminal,
  ArrowLeft,
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

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "Framework", href: "#the-framework" },
    { label: "Technology", href: "#technology" },
    { label: "Research", href: "#research" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-surface)]/90 border-b border-[var(--border-subtle)] transition-colors h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Brand Lockup: Refined, un-cramped horizontal lockup */}
        <div
          onClick={() => onToggleView("landing")}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          role="button"
          tabIndex={0}
          aria-label="Navigate to Home"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm group-hover:opacity-90 transition-opacity shrink-0">
            QML
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <span className="font-sans font-semibold text-sm text-[var(--content-primary)] tracking-tight whitespace-nowrap">
              Adaptive Self-Healing VQC
            </span>
            <span className="text-[11px] text-[var(--content-secondary)] whitespace-nowrap font-sans">
              Autonomous Quantum Closed-Loop Framework
            </span>
          </div>
        </div>

        {/* Public Desktop Navigation: SF Pro Text, not monospace */}
        {activeView === "landing" ? (
          <nav className="hidden md:flex items-center gap-6 font-sans text-sm whitespace-nowrap">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
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
              <span>Documentation</span>
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
        ) : (
          <div className="hidden md:flex items-center gap-3 font-sans text-xs text-[var(--content-secondary)]">
            <span className="font-semibold text-[var(--content-primary)]">Interactive Research Laboratory</span>
            <span>•</span>
            <span>Closed-Loop Telemetry & Control System</span>
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0 font-sans">
          {/* Status Indicator Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-[var(--content-secondary)] font-medium">
              {isConnected ? "Simulator Live" : "Standby"}
            </span>
          </div>

          {/* Primary View Toggle Button */}
          <button
            onClick={() => onToggleView(activeView === "dashboard" ? "landing" : "dashboard")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap active:scale-95 ${
              activeView === "dashboard"
                ? "bg-[var(--bg-subtle)] text-[var(--content-primary)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)]"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            }`}
          >
            {activeView === "dashboard" ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5" />
                <span>Launch Live Lab</span>
              </>
            )}
          </button>

          {/* Compact Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:border-[var(--border-highlight)] transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Toggle Button */}
          {activeView === "landing" && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors"
              aria-label="Open mobile navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && activeView === "landing" && (
        <div className="md:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 space-y-2 shadow-lg font-sans">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-[var(--content-secondary)] hover:text-[var(--content-primary)] font-medium"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://qml-backend-nczx.onrender.com/docs"
            target="_blank"
            rel="noreferrer"
            className="block py-2 text-sm text-[var(--content-secondary)] hover:text-[var(--content-primary)] font-medium"
          >
            Documentation
          </a>
          <a
            href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
            target="_blank"
            rel="noreferrer"
            className="block py-2 text-sm text-[var(--content-secondary)] hover:text-[var(--content-primary)] font-medium"
          >
            GitHub Repository
          </a>
        </div>
      )}
    </header>
  );
};
