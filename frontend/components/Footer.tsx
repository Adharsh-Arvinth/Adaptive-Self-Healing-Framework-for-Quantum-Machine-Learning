"use client";

import React from "react";
import { FileText, ExternalLink, ShieldCheck, Cpu } from "lucide-react";

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 section-cinematic py-16 px-4 sm:px-6 lg:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Identity & Mission */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-md">
                QML
              </div>
              <span className="text-base font-bold font-display tracking-tight text-white uppercase">
                Adaptive Self-Healing VQC
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An autonomous closed-loop runtime self-healing platform for Variational Quantum Classifiers.
              Empirical anomaly detection, Bayesian posterior diagnosis, Contextual Thompson Sampling, digital twin lookahead, and transactional rollback recovery.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>PENNYLANE 0.45.1</span>
              <span>•</span>
              <span>NEXT.JS 14</span>
              <span>•</span>
              <span>MIT LICENSE</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-3 font-sans text-xs">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">
              ARCHITECTURE &amp; SPECIFICATIONS
            </span>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#the-framework" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Self-Healing Lifecycle</span>
                </a>
              </li>
              <li>
                <a href="#contextual-intelligence" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Contextual Thompson Sampling</span>
                </a>
              </li>
              <li>
                <a href="#the-problem" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>6 Quantum Failure Modes</span>
                </a>
              </li>
              <li>
                <a href="#research" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Stage 8 Empirical Proof</span>
                </a>
              </li>
            </ul>
          </div>

          {/* External Links & Repository */}
          <div className="md:col-span-4 space-y-3 font-sans text-xs">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">
              OPEN SOURCE REPOSITORY
            </span>
            <div className="space-y-2.5">
              <a
                href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between text-white group"
              >
                <div className="flex items-center gap-2">
                  <GithubIcon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span className="font-semibold text-xs truncate max-w-[200px]">GitHub Repository</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </a>

              <a
                href="https://qml-backend-nczx.onrender.com/docs"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between text-white group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span className="font-semibold text-xs">FastAPI Interactive Docs</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Legal & Attribution Sub-Footer */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
          <div>
            <span>© 2026 Autonomous Quantum Machine Learning Research Platform. Released under the MIT License.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production Validated</span>
            </span>
            <span>•</span>
            <span>PennyLane 0.45.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
