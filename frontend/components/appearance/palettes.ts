/* --------------------------------------------------------------------------
   Appearance: one source of truth for colour palettes (day + night), font styles
   and the CSS variables they set. Used by the provider, the pre-paint script in
   app/layout.tsx and the picker UI.
   -------------------------------------------------------------------------- */

export type Mode = "day" | "night";
export type PaletteId = "scuderia" | "papaya" | "racing-green" | "ice" | "aurora" | "rose";
export type FontId = "racing" | "swiss" | "editorial" | "technical" | "geometric";

export interface Appearance {
  mode: Mode;
  palette: PaletteId;
  font: FontId;
}

export const DEFAULT_APPEARANCE: Appearance = { mode: "day", palette: "scuderia", font: "racing" };
export const STORAGE_KEY = "shqml-appearance-v1";

interface Tones {
  paper: string; paper2: string; ink: string; ink2: string; ink3: string;
  carbon: string; carbon2: string; signal: string; signal2: string; heal: string;
  accent: string; accentHover: string; surface: string; elevated: string; subtle: string; hover: string;
}

export interface Palette {
  id: PaletteId;
  name: string;
  mood: string;
  day: Tones;
  night: Tones;
}

export const PALETTES: Palette[] = [
  {
    id: "scuderia", name: "Scuderia", mood: "Warm paper, racing red",
    day: { paper: "#f4f1ea", paper2: "#e9e4d8", ink: "#0e0e0e", ink2: "#4e4b45", ink3: "#8a857a", carbon: "#0b0b0c", carbon2: "#151517", signal: "#da291c", signal2: "#ff4d3d", heal: "#1fa463", accent: "#da291c", accentHover: "#b8200f", surface: "#faf8f3", elevated: "#ffffff", subtle: "#ebe6db", hover: "#e2dccf" },
    night: { paper: "#121110", paper2: "#1b1a18", ink: "#f2efe8", ink2: "#b3aea4", ink3: "#7d786f", carbon: "#070707", carbon2: "#101010", signal: "#ff4d3d", signal2: "#ff6a5c", heal: "#3dd68c", accent: "#ff4d3d", accentHover: "#ff6a5c", surface: "#191816", elevated: "#201f1c", subtle: "#24221f", hover: "#2d2b27" },
  },
  {
    id: "papaya", name: "Papaya", mood: "Cream and bright orange",
    day: { paper: "#f7f3ec", paper2: "#ede6da", ink: "#101010", ink2: "#4f4a43", ink3: "#8c857a", carbon: "#0d0d0f", carbon2: "#17171a", signal: "#e8650a", signal2: "#ff8a2a", heal: "#1f9d6a", accent: "#e8650a", accentHover: "#c65405", surface: "#fbf8f3", elevated: "#ffffff", subtle: "#eee7da", hover: "#e5dccc" },
    night: { paper: "#131211", paper2: "#1c1a18", ink: "#f5f0e8", ink2: "#b5ada2", ink3: "#7f786e", carbon: "#080808", carbon2: "#111111", signal: "#ff8a2a", signal2: "#ffa257", heal: "#3dd68c", accent: "#ff8a2a", accentHover: "#ffa257", surface: "#1a1816", elevated: "#211f1c", subtle: "#262320", hover: "#2f2b27" },
  },
  {
    id: "racing-green", name: "Racing Green", mood: "Deep green on old paper",
    day: { paper: "#f1efe6", paper2: "#e4e1d3", ink: "#0f1a14", ink2: "#46524a", ink3: "#838b82", carbon: "#0b140f", carbon2: "#13201a", signal: "#0b6e4f", signal2: "#2fa77a", heal: "#2f9e6a", accent: "#0b6e4f", accentHover: "#085a40", surface: "#f8f7f0", elevated: "#ffffff", subtle: "#e6e3d6", hover: "#dcd8c8" },
    night: { paper: "#0f1411", paper2: "#161d19", ink: "#eef1ea", ink2: "#a9b3aa", ink3: "#737e75", carbon: "#070a08", carbon2: "#0e1410", signal: "#2fa77a", signal2: "#4cc79a", heal: "#4cc79a", accent: "#2fa77a", accentHover: "#4cc79a", surface: "#151c18", elevated: "#1b231e", subtle: "#1f2823", hover: "#28332d" },
  },
  {
    id: "ice", name: "Ice", mood: "Cool grey, electric blue",
    day: { paper: "#eef2f5", paper2: "#e1e7ec", ink: "#0b1320", ink2: "#45505f", ink3: "#808b99", carbon: "#0a0f18", carbon2: "#121a26", signal: "#1f6feb", signal2: "#4b8dff", heal: "#12a37a", accent: "#1f6feb", accentHover: "#1857c4", surface: "#f7f9fb", elevated: "#ffffff", subtle: "#e3e9ef", hover: "#d8e0e8" },
    night: { paper: "#0d121a", paper2: "#141b25", ink: "#e9eef5", ink2: "#a3aebd", ink3: "#6f7b8b", carbon: "#05080d", carbon2: "#0c1119", signal: "#4b8dff", signal2: "#74a8ff", heal: "#34d399", accent: "#4b8dff", accentHover: "#74a8ff", surface: "#131a24", elevated: "#19212d", subtle: "#1d2633", hover: "#263142" },
  },
  {
    id: "aurora", name: "Aurora", mood: "Lilac paper, ultraviolet",
    day: { paper: "#f3f1f8", paper2: "#e7e3f1", ink: "#14101f", ink2: "#4e4860", ink3: "#8a849c", carbon: "#0d0a17", carbon2: "#161223", signal: "#6d4aff", signal2: "#8f73ff", heal: "#14a372", accent: "#6d4aff", accentHover: "#5735e6", surface: "#f9f8fc", elevated: "#ffffff", subtle: "#e9e5f3", hover: "#dfd9ee" },
    night: { paper: "#110e1a", paper2: "#191524", ink: "#efeaf9", ink2: "#aea6c4", ink3: "#786f90", carbon: "#07050d", carbon2: "#0f0c18", signal: "#8f73ff", signal2: "#a993ff", heal: "#34d399", accent: "#8f73ff", accentHover: "#a993ff", surface: "#181425", elevated: "#1f1a2f", subtle: "#231e34", hover: "#2c2641" },
  },
  {
    id: "rose", name: "Rosé", mood: "Blush paper, deep pink",
    day: { paper: "#f7f0ee", paper2: "#eee2df", ink: "#1a1114", ink2: "#574a4e", ink3: "#93858a", carbon: "#120b0e", carbon2: "#1b1216", signal: "#d6336c", signal2: "#f0568a", heal: "#1f9d6a", accent: "#d6336c", accentHover: "#b4255a", surface: "#fbf7f6", elevated: "#ffffff", subtle: "#efe4e1", hover: "#e7d7d3" },
    night: { paper: "#150f11", paper2: "#1e1619", ink: "#f6edef", ink2: "#b9a9ae", ink3: "#82727a", carbon: "#090607", carbon2: "#120c0e", signal: "#f0568a", signal2: "#ff7aa4", heal: "#3dd68c", accent: "#f0568a", accentHover: "#ff7aa4", surface: "#1d1518", elevated: "#241b1f", subtle: "#281e22", hover: "#32272b" },
  },
];

export interface FontStyle {
  id: FontId;
  name: string;
  note: string;
  sample: string; // CSS font-family used for the picker preview
}

export const FONTS: FontStyle[] = [
  { id: "racing", name: "Racing", note: "Condensed signage + wide grotesk", sample: "var(--ff-bigshoulders)" },
  { id: "swiss", name: "Swiss", note: "Tight, neutral, precise", sample: "var(--ff-intertight)" },
  { id: "editorial", name: "Editorial", note: "High-contrast serif headlines", sample: "var(--ff-fraunces)" },
  { id: "technical", name: "Technical", note: "Engineered grotesk + mono", sample: "var(--ff-spacegrotesk)" },
  { id: "geometric", name: "Geometric", note: "Wide, futuristic display", sample: "var(--ff-unbounded)" },
];

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** CSS custom properties for a palette in a given mode. */
export function paletteVars(p: Palette, mode: Mode): Record<string, string> {
  const t = mode === "night" ? p.night : p.day;
  const inkRgb = rgb(t.ink);
  return {
    "--paper": t.paper, "--paper-2": t.paper2, "--ink": t.ink, "--ink-2": t.ink2, "--ink-3": t.ink3,
    "--carbon": t.carbon, "--carbon-2": t.carbon2, "--signal": t.signal, "--signal-2": t.signal2, "--heal": t.heal,
    "--bg-primary": t.paper, "--bg-surface": t.surface, "--bg-surface-elevated": t.elevated, "--bg-subtle": t.subtle, "--bg-hover": t.hover,
    "--border-subtle": `rgb(${inkRgb} / ${mode === "night" ? 0.09 : 0.1})`,
    "--border-highlight": `rgb(${inkRgb} / ${mode === "night" ? 0.18 : 0.22})`,
    "--text-primary": t.ink, "--text-secondary": t.ink2, "--text-tertiary": t.ink3,
    "--content-primary": t.ink, "--content-secondary": t.ink2, "--content-tertiary": t.ink3,
    "--accent": t.accent, "--accent-primary": t.accent, "--accent-hover": t.accentHover,
    "--accent-subtle": `rgb(${rgb(t.accent)} / ${mode === "night" ? 0.13 : 0.09})`,
    "--grid-line": `rgb(${inkRgb} / ${mode === "night" ? 0.04 : 0.05})`,
    "--grid-paper-line": `rgb(${inkRgb} / ${mode === "night" ? 0.05 : 0.045})`,
    "--rgb-ink": inkRgb, "--rgb-paper": rgb(t.paper), "--rgb-carbon": rgb(t.carbon), "--rgb-signal": rgb(t.signal),
    "--rgb-accent": rgb(t.accent), "--rgb-bg-primary": rgb(t.paper), "--rgb-bg-surface": rgb(t.surface),
    "--rgb-bg-surface-elevated": rgb(t.elevated), "--rgb-bg-subtle": rgb(t.subtle),
  };
}

export function sanitize(a: Partial<Appearance> | null | undefined): Appearance {
  const mode: Mode = a?.mode === "night" ? "night" : "day";
  const palette = PALETTES.some((p) => p.id === a?.palette) ? (a!.palette as PaletteId) : DEFAULT_APPEARANCE.palette;
  const font = FONTS.some((f) => f.id === a?.font) ? (a!.font as FontId) : DEFAULT_APPEARANCE.font;
  return { mode, palette, font };
}

/** Apply an appearance to <html>: class, data attributes and CSS variables. */
export function applyAppearance(a: Appearance) {
  const root = document.documentElement;
  const p = PALETTES.find((x) => x.id === a.palette) ?? PALETTES[0];
  const vars = paletteVars(p, a.mode);
  for (const k in vars) root.style.setProperty(k, vars[k]);
  root.classList.toggle("dark", a.mode === "night");
  root.style.colorScheme = a.mode === "night" ? "dark" : "light";
  root.dataset.palette = a.palette;
  root.dataset.font = a.font;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", vars["--paper"]);
}

/**
 * Inline pre-paint script (runs before React) so the stored appearance is applied on the first frame.
 * Self-contained: palette tables are embedded as JSON.
 */
export function prePaintScript(): string {
  const table: Record<string, { day: Record<string, string>; night: Record<string, string> }> = {};
  for (const p of PALETTES) table[p.id] = { day: paletteVars(p, "day"), night: paletteVars(p, "night") };
  return `(function(){try{var T=${JSON.stringify(table)};var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"null")||{};var m=s.mode==="night"?"night":"day";var p=T[s.palette]?s.palette:"scuderia";var f=["racing","swiss","editorial","technical","geometric"].indexOf(s.font)>=0?s.font:"racing";var r=document.documentElement,v=T[p][m];for(var k in v)r.style.setProperty(k,v[k]);if(m==="night")r.classList.add("dark");r.style.colorScheme=m==="night"?"dark":"light";r.dataset.palette=p;r.dataset.font=f;}catch(e){}})();`;
}
