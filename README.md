# Flam - Adaptive Layout Engine for Multi-Surface Ads

A framework-agnostic, constraint-based layout engine in TypeScript that takes a single declarative ad specification (`adSpec`) and dynamically resolves valid layouts across wildly different surface constraints (mobile interstitial, broadcast lower-third, retail kiosk, micro banners, and live custom surfaces) without per-surface hardcoded layouts.

---

## 🌟 Key Features

- **Constraint Resolution Algorithm (No Hardcoded Surface Branches)**: Uses geometric space budgeting, aspect-ratio orientation classification (`portrait`, `landscape`, `square`), and safe area insets to compute non-overlapping bounding boxes.
- **Priority-Based Degradation**: When space is insufficient, lower-priority elements (e.g. branding, badges, taglines) shrink or drop before higher-priority elements (e.g. CTA, headline, hero image) are compromised.
- **Surface Hard Constraints**: Enforces `minTapTarget` (e.g. 44px/60px touch targets) and `minTextSize` (e.g. 32px for broadcast far viewing distances).
- **Dual Rendering Backends**: Supports both DOM/CSS rendering (React) and an HTML5 2D Canvas backend sharing the exact same layout resolver engine.
- **Live Custom Surface Creator**: Tweak surface dimensions (`width`, `height`, `minTapTarget`, `minTextSize`) live in the UI to demonstrate resolving arbitrary unseen surface profiles on the fly.
- **100% Type-Safe**: Comprehensive TypeScript domain models preventing invalid specs or surface combinations.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- npm or pnpm / yarn

### Installation
```bash
npm install
```

### Run Interactive Demo Application
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Automated Test Suite (Vitest)
```bash
npm run test
```

### Build Production Bundle
```bash
npm run build
```

---

## 📐 Resolution Flow & Architecture

```
+-------------------+       +-----------------------+
|  Ad Spec (Content) |  +    |    Surface Profile    |
| (Priority 1, 2, 3)|       | (SafeArea, Constraints)|
+---------+---------+       +-----------+-----------+
          |                             |
          +--------------+--------------+
                         |
                         v
          +-------------------------------+
          |  Constraint Resolver Engine   |
          |  (src/resolver.ts)            |
          |  1. Safe Area Insets          |
          |  2. Aspect Ratio Flow Class   |
          |  3. Hard Constraints Check    |
          |  4. Space Budgeting Pass      |
          |  5. Priority Degradation Pass |
          |  6. Non-Overlap Box Placement |
          +---------------+---------------+
                          |
                          v
          +-------------------------------+
          |    Resolved Layout Output     |
          | (BBoxes, FontSizes, Logs)     |
          +---------------+---------------+
                          |
          +---------------+---------------+
          |                               |
          v                               v
[ DOM / CSS Renderer ]         [ HTML5 Canvas Backend ]
(src/render-dom.tsx)           (src/render-canvas.tsx)
```

---

## 🧩 Layout Resolution Algorithm (Step-by-Step)

1. **Safe Area & Usable Canvas Calculation**:
   Calculates usable width and height after deducting surface safe area insets:
   $$\text{usableWidth} = \text{width} - (\text{safeArea.left} + \text{safeArea.right})$$
   $$\text{usableHeight} = \text{height} - (\text{safeArea.top} + \text{safeArea.bottom})$$

2. **Aspect Ratio Flow Classification**:
   Computes aspect ratio $AR = \text{usableWidth} / \text{usableHeight}$:
   - $AR \ge 2.0 \implies \text{landscape}$: Columnar flow (Left: Branding/Hero, Center: Headline/Tagline, Right: CTA).
   - $AR \le 0.8 \implies \text{portrait}$: Vertical stacked flow (Top: Logo/Badge, Middle: Hero/Headline, Bottom: Price/CTA).
   - $0.8 < AR < 2.0 \implies \text{square}$: Two-section balanced flow (Top: Hero/Logo, Bottom: Headline/CTA).

3. **Surface Hard Constraint Enforcement**:
   - `minTextSize`: For far-viewing surfaces (broadcast), text font sizes scale up to at least `minTextSize` (e.g. 32px).
   - `minTapTarget`: For touch surfaces, button elements enforce minimum height and width (e.g. 44px/60px).

4. **Space Budgeting & Priority-Based Degradation**:
   Calculates total required space vs. available budget. If total space exceeds bounds:
   - **Pass 1 (Priority 3)**: Optional elements (`tagline`, `badge`, `logo`) shrink padding/font size. If still overflowing, they drop (`visible: false`).
   - **Pass 2 (Priority 2 & Hero)**: Hero image scales down proportionally (e.g. 40% shrink factor) while maintaining aspect ratio.
   - **Pass 3 (Priority 2 Non-CTA)**: Secondary elements like extra price details drop while preserving the CTA button and primary headline.
   - **Priority 1**: Critical elements (`headline`, `product-image`) are guaranteed non-overlapping placement.

5. **Non-Overlapping Geometric Box Placement**:
   Sequentially places visible elements into layout flow slots, calculating exact `(x, y, width, height)` coordinates.

---

## 🎯 TypeScript Design

- **Domain Model Isolation**: `AdSpec`, `SurfaceProfile`, `AdElement`, and `ResolvedLayout` are strictly decoupled.
- **Validation**: `defineAd()` helper verifies unique element IDs and compile-time property types.
- **Type-Safe Layout Output**: `ResolvedElement` provides explicit bounding box geometries that renderers consume directly.

---

## ⏱️ Time Spent & Limitations

- **Time Spent**: ~4 hours (Architecture design, solver algorithm, dual renderers, test suite, and interactive UI).
- **Known Limitations**:
  - Simplified text wrapping estimations (can be enhanced with browser Canvas `measureText()` in future iterations).
  - Fixed set of element roles (`hero`, `primary`, `secondary`, `action`, `branding`, `badge`).

---

## 🤖 AI Usage Disclosure

- **AI Tools Used**: Antigravity AI assistant (Gemini 3.6 Flash High model) for rapid project scaffolding, Vitest assertion generation, and UI layout styling.
