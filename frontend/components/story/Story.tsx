"use client";

import React from "react";
import { Hero } from "./Hero";
import { ChapterFaults } from "./ChapterFaults";
import { ChapterLoop } from "./ChapterLoop";
import { ChapterRepairs } from "./ChapterRepairs";
import { ChapterEvidence } from "./ChapterEvidence";
import { ChapterFinale, ChapterLimits } from "./ChapterFinale";
import { Marquee, useSmoothScroll } from "./motion";

const BAND = ["Detect", "Diagnose", "Rehearse", "Repair", "Validate", "Recover"];

export const Story: React.FC<{ onLaunchLab: () => void; isConnected: boolean }> = ({ onLaunchLab, isConnected }) => {
  useSmoothScroll(true);
  return (
    <main className="w-full">
      <Hero onLaunchLab={onLaunchLab} isConnected={isConnected} />
      <div className="bg-[var(--ink)] text-[var(--paper)] py-5 border-y border-white/5">
        <Marquee duration={30}>
          {BAND.map((w) => (
            <span key={w} className="type-condensed text-[clamp(2.2rem,5vw,4rem)] px-6 sm:px-10 flex items-center gap-6 sm:gap-10">
              {w}
              <span className="w-2.5 h-2.5 rotate-45 bg-[var(--signal)]" />
            </span>
          ))}
        </Marquee>
      </div>
      <ChapterFaults />
      <ChapterLoop />
      <ChapterRepairs />
      <ChapterEvidence tone="paper" />
      <ChapterLimits />
      <ChapterFinale onLaunchLab={onLaunchLab} />
    </main>
  );
};
