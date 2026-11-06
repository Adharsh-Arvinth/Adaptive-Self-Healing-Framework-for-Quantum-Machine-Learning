"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft, Terminal, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  onReturnToOverview?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopy = () => {
    const text = `${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || ""}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-6 sm:p-8 border border-amber-500/30 bg-[var(--bg-surface)] text-[var(--content-primary)] font-sans my-4 shadow-xl rounded-2xl max-w-3xl mx-auto animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--content-primary)] tracking-tight">
                  {this.props.fallbackTitle || "Interactive Research Module Interrupted"}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                  Protected Safe State
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[var(--content-secondary)] mt-1.5 leading-relaxed">
                A client-side exception was safely contained by the runtime error boundary. The application did not crash, and your telemetry history and quantum state remain intact.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <button
                  onClick={this.handleReset}
                  className="apple-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Module</span>
                </button>

                {this.props.onReturnToOverview && (
                  <button
                    onClick={this.props.onReturnToOverview}
                    className="apple-btn px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--content-primary)] hover:bg-[var(--border-subtle)] flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Overview</span>
                  </button>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className="apple-btn px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-subtle)] flex items-center gap-1.5 transition-all"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Reload Session</span>
                </button>

                <button
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="apple-btn ml-auto text-xs font-mono text-[var(--content-tertiary)] hover:text-[var(--content-secondary)] flex items-center gap-1 py-1 px-2"
                >
                  <span>{this.state.showDetails ? "Hide Diagnostics" : "View Diagnostics"}</span>
                  {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Collapsible Diagnostics */}
              {this.state.showDetails && (
                <div className="mt-4 p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] text-slate-300 space-y-2 animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-amber-400 font-semibold">Error Diagnostic Log</span>
                    <button
                      onClick={this.handleCopy}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 transition-colors"
                    >
                      {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{this.state.copied ? "Copied" : "Copy Log"}</span>
                    </button>
                  </div>
                  <div className="text-rose-400 font-semibold break-words">
                    {this.state.error?.name}: {this.state.error?.message}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-[10px] text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-tight mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
