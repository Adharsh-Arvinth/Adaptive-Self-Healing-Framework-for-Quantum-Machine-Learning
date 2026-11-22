"use client";

import React from "react";
import { ChapterEvidence } from "./story/ChapterEvidence";

/**
 * Lab view of the benchmark evidence: the same data-driven chapter as the story page
 * (read from /data/qfaultbench_results.json), rendered in the carbon tone.
 */
export const BenchmarksPanel: React.FC<{ apiBase?: string }> = () => <ChapterEvidence tone="carbon" compact />;

export default BenchmarksPanel;
