"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Sun,
  Moon,
  ExternalLink,
  Menu,
  X,
  Activity,
  Terminal,
  ShieldCheck,
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
  pipelineState,
  stepCount,
  maxSteps,
  isRunning,
  isDarkMode,
  onToggleTheme,
  onStart,
  onPause,
  onResume,
  onStep,
  onResetPrompt,
  activeView,
  onToggleView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "The Framework", href: "#the-framework" },
    { label: "Technology", href: "#technology" },
    { label: "Research Evidence", href: "#research" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[var(--bg-primary)]/90 border-b border-[var(--border-subtle)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onToggleView("landing")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B4C2F] via-[#A65E3E] to-[#6E432A] flex items-center justify-center text-white font-mono font-bold text-xs shadow-md shadow-[#A65E3E]/20 group-hover:scale-105 transition-transform">
              QML
            </div>
            <div>
              <span className="font-display font-extrabold text-sm sm:text-base text-[var(--content-primary)] uppercase tracking-tight block">
                Adaptive Self-Healing VQC
              </span>
              <span className="text-[10px] font-mono text-[var(--content-tertiary)] block">
                Autonomous Closed-Loop Runtime
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links (Editorial Display) */}
        <nav className="hidden lg:flex items-center gap-6 font-mono text-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => {
                if (activeView === "dashboard") onToggleView("landing");
              }}
              className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1"
            >
              {link.label}
            </a>
          ))}

          <a
            href="https://qml-backend-nczx.onrender.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1 flex items-center gap-1"
          >
            <span>Docs</span>
            <ExternalLink className="w-3 h-3 text-[var(--content-tertiary)]" />
          </a>

          <a
            href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1 flex items-center gap-1"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Right Action Hub: Mode Toggle & Lab Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Real-Time Telemetry Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            <span className="text-[var(--content-secondary)]">
              {isConnected ? "LIVE STREAM" : "OFFLINE"}
            </span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-all active:scale-95"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Primary View Toggle: Landing vs Live Research Lab */}
          <button
            onClick={() => onToggleView(activeView === "dashboard" ? "landing" : "dashboard")}
            className={`apple-btn px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm ${
              activeView === "dashboard"
                ? "bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/20"
                : "bg-[var(--content-primary)] text-[var(--bg-primary)] hover:opacity-90"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{activeView === "dashboard" ? "EXIT LAB [ESC]" : "LIVE LAB ↗"}</span>
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] font-mono text-xs space-y-3 animate-slide-down">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => {
                setMobileMenuOpen(false);
                if (activeView === "dashboard") onToggleView("landing");
              }}
              className="block py-2 text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://qml-backend-nczx.onrender.com/docs"
            target="_blank"
            rel="noreferrer"
            className="block py-2 text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
          >
            FastAPI Interactive Docs ↗
          </a>
          <a
            href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
            target="_blank"
            rel="noreferrer"
            className="block py-2 text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
          >
            GitHub Repository ↗
          </a>
        </div>
      )}
    </header>
  );
};
