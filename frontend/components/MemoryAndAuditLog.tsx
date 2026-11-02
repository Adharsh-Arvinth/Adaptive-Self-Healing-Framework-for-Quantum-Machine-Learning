"use client";

import React, { useState } from "react";
import { Database, Terminal, Search, History, Trash2 } from "lucide-react";
import { Episode, EventItem } from "@/types";

interface MemoryAndAuditLogProps {
  episodes: Episode[];
  events: EventItem[];
  onClearEvents?: () => void;
}

export const MemoryAndAuditLog: React.FC<MemoryAndAuditLogProps> = ({
  episodes = [],
  events = [],
  onClearEvents,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch =
      ep.diagnosed_cause?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.selected_repair?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.episode_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ep.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Failure Memory Panel */}
      <div className="glass-panel p-5 flex flex-col justify-between h-[420px]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-[var(--content-primary)]">
                Episodic Failure Memory (SQLite Vector Store)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--content-secondary)]">
              {filteredEpisodes.length} / {episodes.length} Episodes
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--content-secondary)]" />
              <input
                type="text"
                placeholder="Search episodes by cause, repair or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="RESOLVED">Resolved</option>
              <option value="COMMITTED">Committed</option>
              <option value="ROLLED_BACK">Rolled Back</option>
            </select>
          </div>
        </div>

        {/* Scrollable Episodes List */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {filteredEpisodes.length > 0 ? (
            filteredEpisodes.map((ep) => (
              <div
                key={ep.episode_id}
                className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs flex items-center justify-between gap-2 hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--content-primary)] font-semibold">
                      {ep.diagnosed_cause?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-[var(--content-secondary)]">
                      {(ep.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--content-secondary)] mt-0.5">
                    Repair: <span className="text-purple-400">{ep.selected_repair?.replace(/_/g, " ")}</span> •{" "}
                    Loss: {ep.loss_before.toFixed(3)} → {ep.loss_after.toFixed(3)}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-bold ${
                      ep.reward >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {ep.reward >= 0 ? `+${ep.reward.toFixed(3)}` : ep.reward.toFixed(3)} r
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      ep.status === "RESOLVED" || ep.status === "COMMITTED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {ep.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--content-secondary)] font-mono text-xs">
              <History className="w-8 h-8 mb-2 opacity-30" />
              <span>No failure episodes match filter.</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Pipeline Event Stream */}
      <div className="glass-panel p-5 flex flex-col justify-between h-[420px]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-[var(--content-primary)]">
                Autonomous Pipeline Event Stream
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--content-secondary)]">
                Real-Time Audit ({events.length})
              </span>
              {onClearEvents && events.length > 0 && (
                <button
                  onClick={onClearEvents}
                  title="Clear event log"
                  className="p-1 rounded text-[var(--content-secondary)] hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Audit Log */}
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 font-mono text-xs">
          {events.length > 0 ? (
            events.slice(0, 50).map((evt, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-2"
              >
                <span className="text-emerald-400 shrink-0 select-none">›</span>
                <div className="leading-snug">
                  <span className="text-[10px] text-purple-400 font-semibold mr-1.5">
                    [{evt.state}]
                  </span>
                  <span className="text-[var(--content-primary)] text-[11px]">{evt.message}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--content-secondary)] font-mono text-xs">
              <Terminal className="w-8 h-8 mb-2 opacity-30" />
              <span>Awaiting pipeline state transitions...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
