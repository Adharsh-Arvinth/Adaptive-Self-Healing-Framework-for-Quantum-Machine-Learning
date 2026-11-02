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
  // Physical Bloch vector radius r = sqrt(x^2 + y^2 + z^2)
  const rPhysical = Math.sqrt(x * x + y * y + z * z);
  // Pure state has r = 1; mixed state has r < 1; maximally mixed has r = 0
  // Quantum purity gamma = Tr(rho^2) = (1 + r^2) / 2 in [0.5, 1.0]
  const purityPhysical = Math.min(1.0, Math.max(0.5, (1 + rPhysical * rPhysical) / 2));

  // Mitigated vector radius & purity if available
  const hasMitigated =
    xMitigated !== undefined && yMitigated !== undefined && zMitigated !== undefined;
  const rMitigated = hasMitigated
    ? Math.sqrt(xMitigated * xMitigated + yMitigated * yMitigated + zMitigated * zMitigated)
    : 0;
  const purityMitigated = hasMitigated
    ? Math.min(1.0, Math.max(0.5, (1 + rMitigated * rMitigated) / 2))
    : 0;

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

  // 3D to 2D Orthographic Isometric Projection
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 95;

  const radAzim = (azimuth * Math.PI) / 180;
  const radElev = (elevation * Math.PI) / 180;
  const cosElev = Math.cos(radElev);
  const sinElev = Math.sin(radElev);
  const cosAzim = Math.cos(radAzim);
  const sinAzim = Math.sin(radAzim);

  const project = (px: number, py: number, pz: number) => {
    // 3D rotation around Z (azimuth) then X (elevation)
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
    <div className="glass-panel p-5 flex flex-col justify-between items-center text-center select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--content-primary)]">
          <Atom className="w-4 h-4 text-purple-400" />
          <span>Qubit {qubitIndex} Bloch Sphere</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetView}
            title="Reset 3D camera rotation"
            className="p-1 rounded-md glass-panel-subtle text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <div className="px-2 py-0.5 rounded-full glass-panel-subtle text-[11px] font-mono flex items-center gap-1">
            <span className="text-[var(--content-secondary)]">Purity γ:</span>
            <span
              className={
                purityPhysical >= 0.95
                  ? "text-emerald-400 font-semibold"
                  : "text-amber-400 font-semibold"
              }
            >
              {purityPhysical.toFixed(4)}
            </span>
            {hasMitigated && (
              <span className="text-emerald-400 text-[10px] ml-1">
                (mit: {purityMitigated.toFixed(4)})
              </span>
            )}
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
          className="overflow-visible"
        >
          {/* Subtle Outer Glow Sphere */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="rgba(168, 85, 247, 0.04)"
            stroke="var(--border-subtle)"
            strokeWidth="1.2"
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
            stroke="var(--border-strong)"
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
            className="text-[10px] fill-purple-400 font-mono font-medium"
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

          {/* Error-Mitigated Vector (if active) */}
          {mitigatedPos && (
            <>
              <line
                x1={origin.x}
                y1={origin.y}
                x2={mitigatedPos.x}
                y2={mitigatedPos.y}
                stroke="#10b981"
                strokeWidth="2.0"
                strokeDasharray="3 2"
                strokeLinecap="round"
              />
              <circle
                cx={mitigatedPos.x}
                cy={mitigatedPos.y}
                r={4}
                fill="#34d399"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </>
          )}

          {/* Physical Quantum State Vector Arrow (From origin to (x, y, z)) */}
          <line
            x1={origin.x}
            y1={origin.y}
            x2={statePos.x}
            y2={statePos.y}
            stroke="#a855f7"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Tip of State Vector Indicator */}
          <circle
            cx={statePos.x}
            cy={statePos.y}
            r={5}
            fill="#c084fc"
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

      {/* Expectation Values & Mitigated Readouts */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2.5 border-t border-[var(--border-subtle)] font-mono text-xs">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--content-secondary)]">⟨X⟩</span>
          <span className="text-[var(--content-primary)] font-semibold">{x.toFixed(3)}</span>
          {hasMitigated && (
            <span className="text-[9px] text-emerald-400">mit: {xMitigated!.toFixed(3)}</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--content-secondary)]">⟨Y⟩</span>
          <span className="text-[var(--content-primary)] font-semibold">{y.toFixed(3)}</span>
          {hasMitigated && (
            <span className="text-[9px] text-emerald-400">mit: {yMitigated!.toFixed(3)}</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--content-secondary)]">⟨Z⟩</span>
          <span className="text-purple-400 font-semibold">{z.toFixed(3)}</span>
          {hasMitigated && (
            <span className="text-[9px] text-emerald-400">mit: {zMitigated!.toFixed(3)}</span>
          )}
        </div>
      </div>

      {/* Purity Formula Note */}
      <div className="w-full mt-2 pt-1 text-[9px] font-mono text-[var(--content-secondary)] flex items-center justify-between border-t border-[var(--border-subtle)]/50">
        <span className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-purple-400" />
          <span>γ = (1 + ||r||²)/2</span>
        </span>
        <span>||r|| = {rPhysical.toFixed(4)}</span>
      </div>
    </div>
  );
};
