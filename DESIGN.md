---
version: alpha
name: AI Learning Playground — Deep Space
description: >
  Spatial mission-control aesthetic. Every cockpit is a living visualization —
  not a dashboard of boxes, but an inhabitable space where AI concepts become
  observable phenomena. Inspired by NASA/JPL telemetry systems and deep-space
  mission control. Users don't read about AI; they watch it happen in a void.

colors:
  # ── Void (backgrounds) ──────────────────────────────────────────
  void:           "#020810"   # true deep-space black, almost no blue
  void-near:      "#060d1a"   # slightly elevated surface — panels float here
  void-panel:     "#0a1628"   # glassmorphism base for floating HUD panels
  void-rim:       "#0f2040"   # active panel border, orbital rim color

  # ── Signal (primary interaction) ────────────────────────────────
  signal:         "#00d4ff"   # cyan — active nodes, orbital arcs, data flow
  signal-dim:     "#0090b8"   # same hue, 55% brightness — inactive arcs
  signal-glow:    "#003d4d"   # dark teal used as bloom base tint behind active elements

  # ── Telemetry (data values) ──────────────────────────────────────
  telemetry:      "#f0c060"   # amber — numbers, live values, velocity readings
  telemetry-dim:  "#7a6030"   # dim amber for secondary data labels

  # ── Status ──────────────────────────────────────────────────────
  nominal:        "#3ddc84"   # green — connected, running, healthy
  nominal-dim:    "#1e6e42"   # dim green — idle/ready state
  caution:        "#ffa040"   # orange — warnings, slow responses
  critical:       "#ff4060"   # red — errors, failures, disconnected
  critical-glow:  "#4d0014"   # dark crimson used as error bloom base tint

  # ── Primary (required alias) ────────────────────────────────────
  primary:        "#00d4ff"   # alias for signal — the dominant interactive color

  # ── Protocol accent colors (per cockpit) ───────────────────────
  mcp:            "#00d4ff"   # MCP Inspector — cyan (JSON-RPC signal)
  a2a:            "#a78bfa"   # A2A Protocol — violet (cross-agent)
  agui:           "#34d399"   # AG-UI Events — emerald (real-time stream)
  multiagent:     "#f472b6"   # Multi-Agent — pink (orchestration mesh)
  finetuning:     "#fb923c"   # Fine-Tuning — orange (training heat)
  workflow:       "#818cf8"   # Workflow DAG — indigo (execution flow)

  # ── Typography ──────────────────────────────────────────────────
  text-primary:   "#e8f4ff"   # near-white with blue tint — primary labels
  text-secondary: "#7aa4cc"   # blue-gray — secondary labels, annotations
  text-data:      "#f0c060"   # same as telemetry — all live numeric values
  text-dim:       "#2a4060"   # barely visible — background structural labels

typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: 700
    letterSpacing: "-0.02em"
    color: "{colors.text-primary}"
  cockpit-title:
    fontFamily: Space Grotesk
    fontSize: 0.875rem
    fontWeight: 600
    letterSpacing: "0.12em"
    textTransform: uppercase
    color: "{colors.text-secondary}"
  label:
    fontFamily: Space Grotesk
    fontSize: 0.6875rem
    fontWeight: 500
    letterSpacing: "0.10em"
    textTransform: uppercase
    color: "{colors.text-secondary}"
  data-value:
    fontFamily: JetBrains Mono
    fontSize: 1.5rem
    fontWeight: 400
    fontVariantNumeric: tabular-nums
    color: "{colors.telemetry}"
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 0.625rem
    fontWeight: 400
    letterSpacing: "0.08em"
    textTransform: uppercase
    color: "{colors.text-secondary}"
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: 400
    color: "{colors.text-primary}"
  annotation:
    fontFamily: JetBrains Mono
    fontSize: 0.625rem
    fontVariantNumeric: tabular-nums
    color: "{colors.text-secondary}"

spacing:
  xs:  4px
  sm:  8px
  md:  16px
  lg:  24px
  xl:  40px
  2xl: 64px

rounded:
  node:   "9999px" # agent nodes, protocol endpoints — always circles (use on equal-width/height elements)
  panel:  "12px"   # HUD panels — subtle rounding
  badge:  "4px"    # status badges — nearly square
  pill:   "9999px" # tags, method labels

components:
  hud-panel:
    backgroundColor: "{colors.void-panel}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"

  protocol-node:
    backgroundColor: "{colors.void-near}"
    width: "48px"
    height: "48px"
    rounded: "{rounded.node}"

  protocol-node-large:
    backgroundColor: "{colors.void-near}"
    width: "64px"
    height: "64px"
    rounded: "{rounded.node}"

  protocol-node-small:
    backgroundColor: "{colors.void-near}"
    width: "32px"
    height: "32px"
    rounded: "{rounded.node}"

  packet-dot:
    backgroundColor: "{colors.signal}"
    width: "8px"
    height: "8px"
    rounded: "{rounded.node}"

  method-badge:
    backgroundColor: "{colors.void-near}"
    textColor: "{colors.signal}"
    typography: "annotation"
    rounded: "{rounded.badge}"
    padding: "{spacing.xs}"

  telemetry-block:
    backgroundColor: "{colors.void-panel}"
    textColor: "{colors.telemetry}"
    typography: "data-value"
    rounded: "{rounded.panel}"
    padding: "{spacing.sm}"

  status-nominal:
    backgroundColor: "{colors.void-near}"
    textColor: "{colors.nominal}"
    rounded: "{rounded.badge}"
    padding: "{spacing.xs}"

  status-critical:
    backgroundColor: "{colors.critical-glow}"
    textColor: "{colors.critical}"
    rounded: "{rounded.badge}"
    padding: "{spacing.xs}"
---

## Overview

The AI Learning Playground is a **spatial mission-control interface** for AI concepts. Every cockpit is not a webpage with cards — it is a *view into a living system*. The user inhabits a dark void and watches AI protocols, agent networks, and training runs unfold as real observable events: arcs of light between nodes, amber numbers ticking, orbital graphs that breathe.

The reference aesthetic is NASA/JPL deep-space telemetry: the Artemis mission visualizer, JPL Eyes on the Solar System, JWST operations dashboards. Not Material Design. Not a SaaS product. A control room for something that matters.

**The one rule:** no flat boxes. Every container is either a floating HUD panel (glassmorphism, glowing rim, transparent fill) or pure canvas (no container at all). Structure is communicated by spatial position and light, not by border boxes.

---

## Colors

**The void** is the canvas. `#020810` — darker than slate-900, nearly true black with a barely-perceptible blue tint. This is what you see when you look at the system from the outside.

**Signal (`#00d4ff`)** is active communication. It is the color of an MCP JSON-RPC packet traveling from CLIENT to SERVER. It is the color of a live agent connection. When signal glows, something is happening.

**Telemetry (`#f0c060`)** is every number that means something: token counts, latency in milliseconds, bytes transferred, epoch number, loss value. Amber on dark void is the language of data that matters. Never use white for live data values.

**Nominal / Caution / Critical** are the three system states. Green means the simulation is running and healthy. Orange means degraded. Red means failed or disconnected. These are never decorative — they always mean something.

**Protocol accents** give each cockpit its own orbital signature. MCP is cyan (same as signal — it *is* the reference protocol). A2A is violet — cross-framework, alien. AG-UI is emerald — streaming, alive. Multi-agent is pink — social, networked. Fine-tuning is orange — heat, computation. Workflow is indigo — logic, flow.

---

## Typography

Two font families, no others:

- **Space Grotesk** — structural labels, cockpit titles, navigation. Tight tracking, uppercase. This is what labels the system.
- **JetBrains Mono** — all live data: JSON payloads, token counts, latency values, method names, protocol messages. Tabular-nums always on. This is what the system says.

Never mix these roles. A heading is never monospace. A data value is never proportional.

**Size discipline:** Labels are 11px uppercase. Data values are 14–24px mono depending on prominence. Body copy does not exist — users read events, not paragraphs. Annotations are 10px mono, color `text-secondary`.

---

## Layout

**There is no page layout.** There is a full-screen void, and within it: floating HUD panels and a central canvas.

The central canvas is where the visualization lives — graph, arc diagram, orbital view, D3 tree. It has no border. It has no background. It is just space.

HUD panels float on top, anchored to corners and edges. They have glassmorphism treatment: `background: rgba(10, 22, 40, 0.72)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(0,212,255,0.12)`. They glow subtly at their rim.

**Grid:** 12-column on wide screens. Panels take 2–4 columns. Canvas takes the remaining space and is always the visual dominant.

**The cockpit layout pattern:**
```
┌─────────────────────────────────────────────────────────┐
│  [header HUD: cockpit name + spec badge + status]       │
├──────────┬──────────────────────────────────┬───────────┤
│  [tree   │                                  │  [detail  │
│  panel]  │     SPATIAL CANVAS               │   panel]  │
│  200px   │     (D3 / Three.js / Canvas)     │   280px   │
│  glass   │     no background, no border     │   glass   │
├──────────┴──────────────────────────────────┴───────────┤
│  [tab bar + controls strip]                             │
└─────────────────────────────────────────────────────────┘
```

Never nest panels inside panels. Never stack boxes vertically without canvas space between them.

---

## Elevation & Depth

Three depth levels:

1. **Void** — the background. Nothing renders here except ambient particles and very dim grid lines (`rgba(0,212,255,0.03)`).
2. **Canvas** — D3/Three.js/SVG visualizations. No panel treatment. Nodes, arcs, and orbits live here.
3. **HUD** — floating glassmorphism panels. Always above canvas. Always partially transparent so the canvas shows through.

Elevation is expressed through:
- **Blur**: HUD panels have `backdrop-filter: blur(16px)`. Canvas has none.
- **Glow**: Active nodes and edges emit light (`box-shadow` / `filter: drop-shadow`). Inactive elements do not glow.
- **Opacity**: Dim arcs use 30% opacity. Active arcs use 100%. Completed events decay to 20%.

Do not use `z-index` stacking as the only depth signal — combine it with glow intensity.

---

## Shapes

**Nodes are circles.** Always. No squares, no rounded-rects for protocol endpoints, agents, or graph nodes. A circle communicates "this is an entity." The border is the accent color. The fill is `rgba(accent, 0.08)`. The glow is `box-shadow: 0 0 16px rgba(accent, 0.18)`.

**Connections are arcs.** Not straight lines, not elbow connectors. SVG cubic bezier curves or D3 linkHorizontal/linkRadial. The stroke is signal color. The packet that travels along it is a circle dot that follows the path with `getPointAtLength`.

**HUD panels are rounded rectangles.** `border-radius: 12px`. The top edge has `border-top: 1px solid rgba(255,255,255,0.08)` for a light-catch effect. The outer border is `1px solid rgba(signal, 0.12)`.

**Never:** Chevron shapes, hexagons (unless for a specific data cell), hard drop shadows, raised buttons. This is a flat-in-depth system — everything is glowing, nothing is embossed.

---

## Components

### HUD Panel

The building block of cockpit chrome. Used for tree panels, telemetry readouts, message logs.

```css
background: rgba(10, 22, 40, 0.72);
backdrop-filter: blur(16px) saturate(180%);
border: 1px solid rgba(0, 212, 255, 0.12);
border-radius: 12px;
box-shadow:
  0 0 0 1px rgba(0,212,255,0.06),
  0 8px 32px rgba(0,0,0,0.6),
  inset 0 1px 0 rgba(255,255,255,0.04);
```

### Telemetry Block

A label/value pair used for all live numeric data. Never use plain text for this.

```
TOKEN COUNT         (label — 10px uppercase mono, text-secondary)
24,891              (value — 24px mono, telemetry amber)
```

### Protocol Node

A circle representing a protocol endpoint (CLIENT, SERVER, AGENT).

```css
width: 48px; height: 48px;
border-radius: 50%;
border: 2px solid var(--signal);
background: rgba(0,212,255,0.08);
box-shadow: 0 0 16px rgba(0,212,255,0.18), 0 0 40px rgba(0,212,255,0.08);
```

Size varies by importance: 32px for leaf nodes, 48px for primary endpoints, 64px for supervisor/root agents.

### Arc Beam

SVG path connecting two nodes.

```svg
<path
  d="M 200 240 C 350 100 450 380 600 240"
  stroke="#00d4ff"
  stroke-width="1.5"
  fill="none"
  filter="drop-shadow(0 0 6px rgba(0,212,255,0.6))"
/>
```

Animated packet: a circle that follows `getPointAtLength(t * totalLength)` on the path, `t` from 0→1 via `requestAnimationFrame`.

### Method Badge

Inline label for JSON-RPC method names, event types, protocol methods.

```css
font-family: JetBrains Mono;
font-size: 10px;
padding: 2px 8px;
border-radius: 4px;
background: rgba(0,212,255,0.10);
border: 1px solid rgba(0,212,255,0.25);
color: #00d4ff;
letter-spacing: 0.06em;
```

Each protocol cockpit uses its accent color instead of signal cyan.

---

## What NOT to Do

1. **No solid-filled panels.** `bg-slate-800` or `bg-surface-elevated` with no transparency looks like a generic SaaS app. Every panel must be glassmorphism — partially transparent, backdrop-filtered.

2. **No box-based protocol diagrams.** Two rectangles labeled CLIENT and SERVER connected by an arrow is not spatial. Circles connected by glowing arcs are spatial.

3. **No white or near-white data values.** Live numbers (token counts, latency, loss values) must use telemetry amber (`#f0c060`). White is reserved for status text and labels that aren't live data.

4. **No borders for layout.** `border-bottom: 1px solid` as a divider between sections is flat. Use spatial separation — distance, glow contrast, panel edge vs canvas edge — to separate zones.

5. **No default Tailwind grays.** `text-gray-400`, `bg-gray-800`, `border-gray-700` — these read as "Bootstrap from 2015." Use the named color tokens: `text-secondary`, `void-panel`, `signal-dim`.

6. **No button-primary for simulation controls.** Play/Pause/Step controls are transparent with a signal-colored icon and text. They hover to reveal a subtle glow. They are not filled buttons.

7. **No animation purely for decoration.** Every animation communicates state: a pulsing ring on a node means it is actively processing. A traveling dot on an arc means a message is in flight. A fading trail means a message just completed. Nothing pulses without reason.
