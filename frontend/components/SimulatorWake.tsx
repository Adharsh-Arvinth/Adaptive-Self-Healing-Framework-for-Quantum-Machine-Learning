"use client";

import { useEffect, useState } from "react";
import trace from "../public/data/recorded_trace.json";

export function SimulatorWake() {
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 10000);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (frame === null || frame >= trace.points.length - 1) return;
    const timer = window.setTimeout(() => setFrame(frame + 1), 600);
    return () => window.clearTimeout(timer);
  }, [frame]);
  const point = frame === null ? null : trace.points[frame];
  return <section aria-label="Simulator connection" className="p-4 border-b">
    <p role="status">{ready ? "Still connecting to the simulator." : "Waking the simulator. A recorded run will be available in 10 seconds."}</p>
    {ready && <button className="btn-ink border mt-2" onClick={() => setFrame(0)}>Replay recorded Iris run</button>}
    {point && <p>Recorded validation trace · Iris · LR too large · no repair · step {point.step} · loss {point.loss.toFixed(3)} · accuracy {(100 * point.accuracy).toFixed(1)}%</p>}
  </section>;
}
