# Design System: Apple macOS-Inspired Research Dashboard

**Document:** Visual & Interaction Design System  
**Reference Standards:** Apple WWDC Fluid Interfaces, Apple Human Interface Guidelines, Emil Kowalski Design Engineering Principles  
**Target Platform:** Next.js 15+ (App Router) • React 19 • Tailwind CSS • Motion • Recharts • Base UI

---

## 1. Visual Direction & Aesthetic Philosophy

The interface is engineered to evoke the calm authority, scientific precision, and tactile satisfaction of a native macOS Pro workstation application (e.g., Xcode, Instruments, Logic Pro). It rejects generic AI dashboard tropes (gratuitous neon purple gradients, cluttered cards, jarring decorative bouncy animations) in favor of:
- **Calm, High-Contrast Typography:** Platform system font stack with size-specific optical tracking.
- **Translucent Structural Layers:** Restrained, functional glassmorphism where content flows beneath translucent toolbars and sidebars.
- **Immediate, Tactile Physics:** 1:1 direct tracking, instantaneous pointer-down feedback, and critically damped spring transitions.
- **Semantic Clarity:** Color is reserved strictly for meaningful states (nominal, warning, failure, recovery, verified).

---

## 2. Color Tokens & Palette

### Neutral Surfaces & Typography
| Token | Light Mode Value | Dark Mode Value | Usage |
|---|---|---|---|
| `--bg-canvas` | `#F5F5F7` (macOS Window Gray) | `#000000` (Pure OLED Black) | Base page background |
| `--bg-surface-elevated` | `rgba(255, 255, 255, 0.82)` | `rgba(28, 28, 30, 0.75)` | Cards, panels, modals |
| `--bg-toolbar` | `rgba(246, 246, 246, 0.75)` | `rgba(22, 22, 24, 0.75)` | Sticky header / navigation bar |
| `--border-subtle` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.10)` | Card outlines, panel dividers |
| `--border-highlight` | `rgba(255, 255, 255, 0.60)` | `rgba(255, 255, 255, 0.18)` | Light-catching top border edge |
| `--text-primary` | `#1D1D1F` (SF Pro Black) | `#F5F5F7` (SF Pro White) | Headings, primary metrics |
| `--text-secondary` | `#86868B` (SF Gray) | `#A1A1A6` (SF Dim Gray) | Labels, supporting metadata |
| `--text-tertiary` | `#AEAEB2` | `#636366` | Timestamp footers, inactive tabs |

### Semantic Status Indicators
| Status | Accent Color | Light Mode Badge | Dark Mode Badge | Meaning |
|---|---|---|---|---|
| **Nominal / Healthy** | `rgb(52, 199, 89)` (Apple Green) | `rgba(52, 199, 89, 0.12)` | `rgba(52, 199, 89, 0.20)` | Training convergent; gradients healthy |
| **Observation / Warning** | `rgb(255, 149, 0)` (Apple Orange) | `rgba(255, 149, 0, 0.12)` | `rgba(255, 149, 0, 0.20)` | Confidence gate hold; anomaly suspected |
| **Failure / Critical** | `rgb(255, 59, 48)` (Apple Red) | `rgba(255, 59, 48, 0.12)` | `rgba(255, 59, 48, 0.20)` | Barren plateau, NaN loss, divergence |
| **Active Repair / Adaptive** | `rgb(0, 122, 255)` (Apple Blue) | `rgba(0, 122, 255, 0.12)` | `rgba(0, 122, 255, 0.20)` | Digital twin running; TS arm active |
| **Verified Recovery** | `rgb(175, 82, 222)` (Apple Purple) | `rgba(175, 82, 222, 0.12)` | `rgba(175, 82, 222, 0.20)` | Safe deployment committed to memory |

---

## 3. Typography & Optical Sizing Rules

Following WWDC 2020 *The Details of UI Typography*:
- **System Stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Monospace Stack (Telemetry & Gradients):** `"SF Mono", "Menlo", "Monaco", "Consolas", monospace`

### Typography Scale
| Style | Size | Line Height | Tracking | Weight |
|---|---|---|---|---|
| **Large Title** | `34px` (`2.125rem`) | `1.15` | `-0.022em` (Tight) | `700` (Bold) |
| **Title 1** | `28px` (`1.75rem`) | `1.20` | `-0.020em` | `600` (SemiBold) |
| **Title 2** | `22px` (`1.375rem`) | `1.25` | `-0.015em` | `600` (SemiBold) |
| **Title 3** | `17px` (`1.0625rem`) | `1.30` | `-0.010em` | `600` (SemiBold) |
| **Body (Default)** | `14px` (`0.875rem`) | `1.45` | `0em` (Neutral) | `400` (Regular) |
| **Callout** | `13px` (`0.8125rem`) | `1.40` | `+0.005em` | `500` (Medium) |
| **Footnote / Caption**| `11px` (`0.6875rem`) | `1.35` | `+0.015em` (Loose) | `400` (Regular) |
| **Telemetry Monospace**| `12px` (`0.75rem`) | `1.40` | `+0.020em` | `500` (Medium) |

---

## 4. Spacing, Radii & Depth Hierarchy

### Spacing Scale
- `2xs: 4px`, `xs: 8px`, `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`

### Border Radii
- Window / Modal Container: `16px` (`rounded-2xl`)
- Interactive Cards: `12px` (`rounded-xl`)
- Buttons & Input Fields: `8px` (`rounded-lg`)
- Status Chips & Badges: `9999px` (`rounded-full`)

### Material Depth & Glass Treatment
```css
/* Glass Card Base */
.apple-glass-card {
  background: var(--bg-surface-elevated);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 0 var(--border-highlight);
}
```

---

## 5. Interaction Physics & Animation Conventions

Directly implementing WWDC *Designing Fluid Interfaces* and Emil Kowalski design engineering principles:

1. **Instant Pointer Feedback:**
   Every button and interactive card provides instant physical response on `:active`:
   ```css
   .apple-pressable {
     transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1), opacity 140ms ease-out;
   }
   .apple-pressable:active {
     transform: scale(0.97);
   }
   ```

2. **Never Animate from `scale(0)`:**
   Modal and popover entrances always scale in from `scale(0.95)` with simultaneous opacity cross-fade:
   ```css
   .apple-enter {
     transform: scale(0.95);
     opacity: 0;
   }
   .apple-enter-active {
     transform: scale(1.0);
     opacity: 1;
     transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 220ms ease-out;
   }
   ```

3. **Critically Damped Spring Physics:**
   Default spring settings avoid distracting oscillation or childish rubber bouncing:
   - Damping: `1.0` (Critically damped — zero overshoot, crisp settle).
   - Response: `0.35s`.
   - Duration cap: All functional UI transitions strictly complete under `300ms`.

4. **Zero Animation on High-Frequency Actions:**
   Keyboard shortcuts, tab switching, and parameter stepping have zero entry/exit delays to ensure workstation snappiness.

5. **Accessibility & Reduced Motion:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
     .apple-pressable:active {
       transform: none !important;
       opacity: 0.8 !important;
     }
   }
   ```

---

## 6. The Eleven Required Frontend Screens

1. **System Overview:** Top-level KPIs (model health, active faults, recovery success rate, cumulative compute, live status pill).
2. **Live Health Monitoring:** Real-time multi-metric time series (loss trajectory, validation loss, gradient norm $\|\mathbf{g}\|_2$, gradient variance $\operatorname{Var}(\mathbf{g})$, parameter velocity).
3. **Failure Detection:** Live event feed of anomaly alerts, statistical confidence bounds, sliding window evidence, and severity chips.
4. **Root-Cause Diagnosis:** Probabilistic cause distribution bar charts, evidence indicator breakdown, and confidence gate status indicator ($\ge 0.60$ threshold indicator).
5. **Failure Memory:** Interactive 2D projection / searchable table of stored failure vectors, similarity scores ($\operatorname{Sim} \ge 0.85$), and historical recovery outcomes.
6. **Repair Center:** Interactive cards for all 6 locked repair arms showing preconditions, transformation details, safety status, and historical payoff.
7. **Digital Twin:** Side-by-side proxy simulation view showing base model state vs. isolated proxy trajectory, predicted loss improvement $\widehat{\Delta \mathcal{L}}$, and prediction uncertainty.
8. **Adaptive Learning (Bandit):** Contextual Thompson Sampling inspection dashboard showing sampled expected rewards, arm selection counts, posterior mean weights $\boldsymbol{\mu}_a$, covariance eigenvalues, and cumulative regret curve.
9. **Experiment Laboratory:** Interactive experiment designer allowing dataset selection (Iris, Moons, Wine, Circles), circuit depth/qubit configuration, manual synthetic failure injection, and one-click autonomous self-healing execution.
10. **Evaluation & Reports:** Comparative benchmark charts comparing Contextual TS vs Random vs Greedy vs Fixed Rule-based policies across multiple metrics; downloadable research report generator.
11. **Configuration & Settings:** Hardware/simulator target toggle, confidence threshold slider ($\tau_{\text{conf}}$), safety constraints editor, and database reset/export tools.
