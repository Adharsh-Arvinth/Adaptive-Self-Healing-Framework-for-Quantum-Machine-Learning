"use client";

import React from "react";
import { Database, Terminal } from "lucide-react";
import { Episode, EventItem } from "@/types";

interface MemoryAndAuditLogProps {
  episodes: Episode[];
  events: EventItem[];
}

export const MemoryAndAuditLog: React.FC<MemoryAndAuditLogProps> = ({ episodes, events }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Failure Memory Panel */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-neutral-200">
              Persistent Failure Memory (SQLite Vector Store)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            {episodes.length} Episodes Stored
          </span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {episodes.length > 0 ? (
            episodes.map((ep) => (
              <div
                key={ep.episode_id}
                className="p-2.5 rounded-lg glass-panel-subtle font-mono text-xs flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{ep.diagnosed_cause}</span>
                    <span className="text-[10px] text-neutral-400">
                      {(ep.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Repair: <span className="text-purple-300">{ep.selected_repair}</span> •{" "}
                    Loss: {ep.loss_before.toFixed(3)} → {ep.loss_after.toFixed(3)}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-semibold ${
                      ep.reward >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {ep.reward >= 0 ? `+${ep.reward.toFixed(3)}` : ep.reward.toFixed(3)} r
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      ep.status === "RESOLVED" || ep.status === "COMMITTED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {ep.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500 font-mono text-xs">
              Zero failure episodes stored yet.
            </div>
          )}
        </div>
      </div>

      {/* Live Pipeline Event Stream */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-neutral-200">
              Autonomous Pipeline Event Stream
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Real-Time Audit
          </span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 font-mono text-xs">
          {events.length > 0 ? (
            events.slice(-10).map((evt, i) => (
              <div
                key={i}
                className="p-2 rounded bg-black/25 border border-white/5 flex items-start gap-2"
              >
                <span className="text-emerald-400 shrink-0">›</span>
                <div>
                  <span className="text-[10px] text-purple-400 font-semibold mr-1.5">
                    [{evt.state}]
                  </span>
                  <span className="text-neutral-300 text-[11px]">{evt.message}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500 font-mono text-xs">
              Awaiting pipeline state transitions...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
