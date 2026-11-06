"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Atom, RotateCcw, Compass, Info } from "lucide-react";

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
    <div className="glass-panel p-5 flex flex-col justify-between items-center text-center select-none h-full font-sans">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Atom className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
              Qubit {qubitIndex} State Coordinates
            </h3>
            <p className="text-[11px] text-[var(--content-tertiary)]">
              Physical state vector &amp; corrected expectation estimators
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            title="Reset 3D camera rotation"
            className="p-1 rounded-md bg-[var(--bg-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <div className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono flex items-center gap-1.5">
            <span className="text-[var(--content-secondary)]">Physical γ:</span>
            <span
              className={
                purityPhysical >= 0.95
                  ? "text-[var(--status-success)] font-semibold"
                  : "text-[var(--status-warning)] font-semibold"
              }
            >
              {purityPhysical.toFixed(4)}
            </span>
          </div>
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
        <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[var(--content-secondary)] opacity-60 pointer-events-none flex items-center gap-1">
          <Compass className="w-2.5 h-2.5" />
          <span>drag to rotate</span>
        </div>
      </div>

      {/* Vector Legend: Distinguish Physical from Corrected Expectation */}
      <div className="w-full flex items-center justify-center gap-4 py-1 text-[10px] font-mono border-t border-[var(--border-subtle)] text-[var(--content-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[var(--accent)] rounded-full" />
          <span className="text-[var(--content-primary)]">Physical State r⃗</span>
        </div>
        {hasMitigated && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-[var(--status-purity)]" />
            <span className="text-[var(--status-purity)]">Corrected Estimator</span>
          </div>
        )}
      </div>

      {/* Expectation Values & Mitigated Readouts */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] font-mono text-xs">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--content-secondary)]">⟨X⟩</span>
          <span className="text-[var(--content-primary)] font-semibold">{x.toFixed(3)}</span>
          {hasMitigated && (
            <span className="text-[9px] text-[var(--status-purity)]">est: {xMitigated!.toFixed(3)}</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--content-secondary)]">⟨Y⟩</span>
          <span className="text-[var(--content-primary)] font-semibold">{y.toFixed(3)}</span>
          {hasMitigated && (
            <span className="text-[9px] text-[var(--status-purity)]">est: {yMitigated!.toFixed(3)}</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--content-secondary)]">⟨Z⟩</span>
          <span className="text-[var(--accent)] font-semibold">{z.toFixed(3)}</span>
          {hasMitigated && (
            <span className="text-[9px] text-[var(--status-purity)]">est: {zMitigated!.toFixed(3)}</span>
          )}
        </div>
      </div>

      {/* Purity Formula Note */}
      <div className="w-full mt-2 pt-1 text-[9px] font-mono text-[var(--content-secondary)] flex items-center justify-between border-t border-[var(--border-subtle)]/50">
        <span className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-[var(--accent)]" />
          <span>Physical γ = (1 + ||r||²)/2</span>
        </span>
        <span>||r_phys|| = {rPhysical.toFixed(4)}</span>
      </div>
    </div>
  );
};
