"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw, Compass } from "lucide-react";

interface BlochSphereProps {
  x: number;
  y: number;
  z: number;
  qubitIndex?: number;
  xMitigated?: number;
  yMitigated?: number;
  zMitigated?: number;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({
  x = 0,
  y = 0,
  z = 1,
  qubitIndex = 0,
  xMitigated,
  yMitigated,
  zMitigated,
}) => {
  // Physical Bloch vector radius r_phys = sqrt(x^2 + y^2 + z^2)
  const rPhysical = Math.sqrt(x * x + y * y + z * z);
  // Physical quantum purity gamma = Tr(rho^2) = (1 + r^2) / 2 in [0.5, 1.0]
  // Note: Only the physical state represents a valid density matrix with trace-square purity
  const purityPhysical = Math.min(1.0, Math.max(0.5, (1 + rPhysical * rPhysical) / 2));

  // Corrected expectation values (analytical inverse-noise correction)
  // Per scientific specification: Corrected expectation values are estimators of observables,
  // NOT a synthesized physical density matrix. No physical purity is assigned to them.
  const hasMitigated =
    xMitigated !== undefined && yMitigated !== undefined && zMitigated !== undefined;

  // Interactive Orbit Camera Angles (in degrees)
  const [azimuth, setAzimuth] = useState(38);
  const [elevation, setElevation] = useState(22);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; azim: number; elev: number }>({
    x: 0,
    y: 0,
    azim: 38,
    elev: 22,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      azim: azimuth,
      elev: elevation,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setAzimuth((dragStartRef.current.azim + dx * 0.6) % 360);
      setElevation(Math.max(-85, Math.min(85, dragStartRef.current.elev - dy * 0.6)));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const resetView = () => {
    setAzimuth(38);
    setElevation(22);
  };

  // 3D to 2D Orthographic Isometric Projection - Precision Instrument Scale
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;

  const radAzim = (azimuth * Math.PI) / 180;
  const radElev = (elevation * Math.PI) / 180;
  const cosElev = Math.cos(radElev);
  const sinElev = Math.sin(radElev);
  const cosAzim = Math.cos(radAzim);
  const sinAzim = Math.sin(radAzim);

  const project = (px: number, py: number, pz: number) => {
    const xRot = px * cosAzim - py * sinAzim;
    const yRot = px * sinAzim + py * cosAzim;
    const zRot = pz;

    const screenX = cx + radius * xRot;
    const screenY = cy - radius * (zRot * cosElev - yRot * sinElev);
    const depth = zRot * sinElev + yRot * cosElev;
    return { x: screenX, y: screenY, depth };
  };

  const origin = project(0, 0, 0);
  const statePos = project(x, y, z);
  const zPolePos = project(0, 0, 1.15);
  const southPolePos = project(0, 0, -1.15);
  const xPos = project(1.15, 0, 0);
  const yPos = project(0, 1.15, 0);

  const mitigatedPos = hasMitigated
    ? project(xMitigated!, yMitigated!, zMitigated!)
    : null;

  return (
    <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7 flex flex-col h-full min-w-0 items-center select-none">
      <div className="w-full flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0 text-left">
          <div className="type-label text-[var(--accent)]">Qubit {qubitIndex} · Bloch sphere</div>
          <h3 className="font-display font-bold text-[1.2rem] tracking-[-0.02em] mt-1 text-[var(--content-primary)]">Where the state points</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border type-label !normal-case tabular ${
              purityPhysical >= 0.95
                ? "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-c-status-success/20"
                : "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-c-status-warning/20"
            }`}
            title="Purity: γ = (1 + ‖r‖²) / 2"
          >
            γ {purityPhysical.toFixed(3)}
          </span>
          <button
            onClick={resetView}
            title="Reset rotation"
            aria-label="Reset sphere rotation"
            className="apple-btn w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:border-[var(--border-highlight)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive 3D SVG Projection */}
      <div
        className="relative w-full flex justify-center my-1 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible max-w-full"
        >
          <defs>
            <radialGradient id="blochSphereGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.12" />
              <stop offset="65%" stopColor="var(--accent)" stopOpacity="0.03" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Precision Outer Wireframe Sphere with Ambient Glow */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="url(#blochSphereGlow)"
            stroke="var(--border-highlight)"
            strokeWidth="1.5"
          />

          {/* Equator Ellipse (XY Plane) */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={radius}
            ry={Math.max(1, radius * Math.abs(sinElev))}
            fill="none"
            stroke="var(--border-subtle)"
            strokeDasharray="2 3"
          />

          {/* Meridian Ellipse (XZ Plane) */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={Math.max(1, radius * Math.abs(cosAzim))}
            ry={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeDasharray="2 3"
          />

          {/* Z Axis Line (North - South) */}
          <line
            x1={project(0, 0, -1).x}
            y1={project(0, 0, -1).y}
            x2={project(0, 0, 1).x}
            y2={project(0, 0, 1).y}
            stroke="var(--border-highlight)"
            strokeWidth="1.2"
          />

          {/* X Axis Line */}
          <line
            x1={project(-1, 0, 0).x}
            y1={project(-1, 0, 0).y}
            x2={project(1, 0, 0).x}
            y2={project(1, 0, 0).y}
            stroke="var(--border-subtle)"
            strokeDasharray="2 2"
          />

          {/* Y Axis Line */}
          <line
            x1={project(0, -1, 0).x}
            y1={project(0, -1, 0).y}
            x2={project(0, 1, 0).x}
            y2={project(0, 1, 0).y}
            stroke="var(--border-subtle)"
            strokeDasharray="2 2"
          />

          {/* Basis State Labels */}
          <text
            x={zPolePos.x}
            y={zPolePos.y - 4}
            textAnchor="middle"
            className="text-[10px] fill-[var(--content-primary)] font-mono font-bold"
          >
            |0⟩ (+Z)
          </text>
          <text
            x={southPolePos.x}
            y={southPolePos.y + 12}
            textAnchor="middle"
            className="text-[10px] fill-[var(--content-secondary)] font-mono"
          >
            |1⟩ (-Z)
          </text>
          <text
            x={xPos.x + 8}
            y={xPos.y + 3}
            textAnchor="start"
            className="text-[9px] fill-[var(--content-secondary)] font-mono"
          >
            |+⟩ (X)
          </text>
          <text
            x={yPos.x - 8}
            y={yPos.y + 3}
            textAnchor="end"
            className="text-[9px] fill-[var(--content-secondary)] font-mono"
          >
            |+i⟩ (Y)
          </text>

          {/* Center Origin Dot */}
          <circle cx={origin.x} cy={origin.y} r={2} fill="var(--content-secondary)" />

          {/* Analytical Corrected Expectation Vector (Dashed, Cyan/Teal) */}
          {mitigatedPos && (
            <>
              <line
                x1={origin.x}
                y1={origin.y}
                x2={mitigatedPos.x}
                y2={mitigatedPos.y}
                stroke="var(--status-purity)"
                strokeWidth="1.8"
                strokeDasharray="3 2"
                strokeLinecap="round"
              />
              <circle
                cx={mitigatedPos.x}
                cy={mitigatedPos.y}
                r={3.5}
                fill="var(--status-purity)"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </>
          )}

          {/* Physical Quantum State Vector Arrow (Solid, Royal Sapphire) */}
          <line
            x1={origin.x}
            y1={origin.y}
            x2={statePos.x}
            y2={statePos.y}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#vectorGlow)"
            className="transition-all duration-300"
          />

          {/* Tip of Physical State Vector Indicator */}
          <circle
            cx={statePos.x}
            cy={statePos.y}
            r={4.5}
            fill="var(--accent)"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
        </svg>

        {/* Drag Hint Overlay */}
        <div className="absolute bottom-1 right-2 text-[0.7rem] text-[var(--content-tertiary)] pointer-events-none flex items-center gap-1">
          <Compass className="w-3 h-3" />
          <span>drag to rotate</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 type-label text-[var(--content-tertiary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[var(--accent)] rounded-full" /> State r
        </span>
        {hasMitigated && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t-2 border-dashed border-[var(--status-purity)]" /> Corrected estimate
          </span>
        )}
      </div>

      {/* Expectation values */}
      <div className="w-full grid grid-cols-3 gap-2 mt-1">
        {[
          { k: "⟨X⟩", v: x, m: xMitigated },
          { k: "⟨Y⟩", v: y, m: yMitigated },
          { k: "⟨Z⟩", v: z, m: zMitigated },
        ].map((e) => (
          <div key={e.k} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-left min-w-0">
            <div className="text-xs text-[var(--content-tertiary)] font-mono">{e.k}</div>
            <div className="font-mono tabular text-[var(--content-primary)] font-semibold mt-0.5">{e.v.toFixed(3)}</div>
            {hasMitigated && typeof e.m === "number" && (
              <div className="text-[0.7rem] font-mono tabular text-[var(--status-purity)] truncate">est {e.m.toFixed(3)}</div>
            )}
          </div>
        ))}
      </div>

      <p className="w-full mt-3 text-xs text-[var(--content-tertiary)] text-left">
        γ = (1 + ‖r‖²)/2 · ‖r‖ = <span className="font-mono tabular">{rPhysical.toFixed(3)}</span>
      </p>
    </div>
  );
};
