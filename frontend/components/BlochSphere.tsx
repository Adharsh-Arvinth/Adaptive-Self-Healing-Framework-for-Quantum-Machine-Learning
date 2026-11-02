"use client";

import React from "react";
import { Atom } from "lucide-react";

interface BlochSphereProps {
  x: number;
  y: number;
  z: number;
  qubitIndex?: number;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({ x, y, z, qubitIndex = 0 }) => {
  // Normalize & compute state purity
  const purity = Math.sqrt(x * x + y * y + z * z);

  // SVG Geometry constants
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 75;

  // 3D to 2D Orthographic Isometric Projection
  // Azimuth ~ 35 deg, Elevation ~ 20 deg
  const cosElev = Math.cos((20 * Math.PI) / 180);
  const sinElev = Math.sin((20 * Math.PI) / 180);
  const cosAzim = Math.cos((35 * Math.PI) / 180);
  const sinAzim = Math.sin((35 * Math.PI) / 180);

  const project = (px: number, py: number, pz: number) => {
    // Standard 3D rotation projection
    const xRot = px * cosAzim - py * sinAzim;
    const yRot = px * sinAzim + py * cosAzim;
    const zRot = pz;

    const screenX = cx + radius * xRot;
    const screenY = cy - radius * (zRot * cosElev - yRot * sinElev);
    return { x: screenX, y: screenY };
  };

  const origin = project(0, 0, 0);
  const statePos = project(x, y, z);
  const zPolePos = project(0, 0, 1.15);
  const southPolePos = project(0, 0, -1.15);
  const xPos = project(1.15, 0, 0);
  const yPos = project(0, 1.15, 0);

  return (
    <div className="glass-panel p-5 flex flex-col justify-between items-center text-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-300">
          <Atom className="w-4 h-4 text-purple-400" />
          <span>Qubit {qubitIndex} Bloch Sphere</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full glass-panel-subtle text-[11px] font-mono">
          <span className="text-neutral-400">Purity:</span>
          <span className={purity >= 0.95 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
            {purity.toFixed(3)}
          </span>
        </div>
      </div>

      {/* 3D Orthographic SVG Projection */}
      <div className="relative w-full flex justify-center my-1">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none overflow-visible">
          {/* Subtle Outer Glow */}
          <circle cx={cx} cy={cy} r={radius} fill="rgba(139, 92, 246, 0.04)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" />

          {/* Equator Ellipse (XY Plane) */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={radius}
            ry={radius * sinElev}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="2 3"
          />

          {/* Meridian Ellipse (XZ Plane) */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={radius * cosAzim}
            ry={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="2 3"
          />

          {/* Z Axis Line (North - South) */}
          <line
            x1={project(0, 0, -1).x}
            y1={project(0, 0, -1).y}
            x2={project(0, 0, 1).x}
            y2={project(0, 0, 1).y}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.2"
          />

          {/* X Axis Line */}
          <line
            x1={project(-1, 0, 0).x}
            y1={project(-1, 0, 0).y}
            x2={project(1, 0, 0).x}
            y2={project(1, 0, 0).y}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeDasharray="1 2"
          />

          {/* Y Axis Line */}
          <line
            x1={project(0, -1, 0).x}
            y1={project(0, -1, 0).y}
            x2={project(0, 1, 0).x}
            y2={project(0, 1, 0).y}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeDasharray="1 2"
          />

          {/* Basis State Labels */}
          <text x={zPolePos.x} y={zPolePos.y - 4} textAnchor="middle" className="text-[10px] fill-purple-300 font-mono font-medium">
            |0⟩ (+Z)
          </text>
          <text x={southPolePos.x} y={southPolePos.y + 12} textAnchor="middle" className="text-[10px] fill-neutral-400 font-mono">
            |1⟩ (-Z)
          </text>
          <text x={xPos.x + 8} y={xPos.y + 3} textAnchor="start" className="text-[9px] fill-neutral-400 font-mono">
            |+⟩ (X)
          </text>
          <text x={yPos.x - 8} y={yPos.y + 3} textAnchor="end" className="text-[9px] fill-neutral-400 font-mono">
            |+i⟩ (Y)
          </text>

          {/* Center Origin Dot */}
          <circle cx={origin.x} cy={origin.y} r={2} fill="rgba(255, 255, 255, 0.3)" />

          {/* Quantum State Vector Arrow (From origin to (x, y, z)) */}
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
            r={4.5}
            fill="#c084fc"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="shadow-glow transition-all duration-300"
          />
        </svg>
      </div>

      {/* Expectation Values Readout */}
      <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-white/5 font-mono text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400">⟨X⟩</span>
          <span className="text-white font-medium">{x.toFixed(3)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400">⟨Y⟩</span>
          <span className="text-white font-medium">{y.toFixed(3)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400">⟨Z⟩</span>
          <span className="text-purple-300 font-medium">{z.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
};
