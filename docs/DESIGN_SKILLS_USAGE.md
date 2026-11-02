# Design Skills Usage & Audit Protocol

**Document:** Integration of Installed Design Skills  
**Skill Repository:** `emilkowalski/skills` (16 Skills Installed at `.agents/skills/`)  
**Audit Standard:** Strict Before/After review tables and performance benchmarks.

---

## 1. Skill Integration Mapping Matrix

| Skill Name | Local Path | Applied Domain in Our Framework | Specific Mandate |
|---|---|---|---|
| **`emil-design-eng`** | `.agents/skills/emil-design-eng` | Global Frontend Architecture & Polish | Compounding unseen details, taste-driven components, button press feedback (`scale(0.97)`), no `scale(0)` entry. |
| **`apple-design`** | `.agents/skills/apple-design` | Visual Hierarchy, Depth & Physics | System font optical tracking, translucent blurred materials, critically damped springs (`damping: 1.0`, `response: 0.35s`), direct 1:1 manipulation. |
| **`animate`** | `.agents/skills/animate` | Modal, Drawer, & Chart Motion | Determining purpose, duration bounds ($\le 250\text{ms}$), custom cubic-bezier easings, interruptibility. |
| **`review-animations`** | `.agents/skills/review-animations` | Animation Quality Auditing | Evaluating animations via strict Before/After tables, flagging ease-in regressions, verifying transform-origins. |
| **`improve-animations`** | `.agents/skills/improve-animations` | Motion Tuning & Refinement | Prioritizing motion fixes on interactive controls and removing jank from chart updates. |
| **`animation-performance`**| `.agents/skills/animation-performance` | Frame Rate & Compositor Budget | Enforcing composite-only properties (`transform`, `opacity`), preventing layout thrashing during telemetry streaming. |
| **`pick-ui-library`** | `.agents/skills/pick-ui-library` | Frontend Dependency Curation | Selected: `recharts` for telemetry dashboards, `motion` (Framer Motion) for physical springs, `sonner` for system toasts. |
| **`prototype`** | `.agents/skills/prototype` | Core Component Exploration | Exploring alternative digital-twin vs real model side-by-side comparison layouts before freezing code. |
| **`break-ui`** | `.agents/skills/break-ui` | Stress-Testing & Edge Cases | Testing extreme metric values ($10^6$ loss, NaN, Inf), 0 failure records, narrow viewports (320px to 4K). |
| **`remove-animations`** | `.agents/skills/remove-animations` | Motion Restraint & Subtraction | Removing gratuitous page load animations, keyboard action delays, and looping decorative backgrounds. |
| **`mobile-native`** | `.agents/skills/mobile-native` | Responsive Touch & Mobile Feel | Safe area insets, 100dvh viewport fix, touch-action manipulation, preventing accidental text selection on controls. |

---

## 2. Review Format Standard (Enforced for All Audits)

In accordance with `emil-design-eng`, all UI audits in this project must adhere to the mandatory table format:

| Before | After | Why |
|---|---|---|
| `transition: all 300ms` | `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease-out` | Specify exact properties; avoid layout thrashing; instant response |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing in the real world appears from zero |
| `ease-in` on dropdown | `cubic-bezier(0.23, 1, 0.32, 1)` | `ease-in` delays initial movement and feels sluggish |
| No `:active` feedback | `transform: scale(0.97)` on `:active` | Buttons must provide immediate tactile feedback |
| Centered popover scale | `transform-origin: var(--transform-origin)` | Popovers must visually expand from their trigger element |
