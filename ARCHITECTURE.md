# Architecture - Adaptive Layout Engine

This document details the software architecture, data flow, and modular separation of concerns in the **Flam Adaptive Layout Engine**.

---

## 🏛 Component Overview

```
[Ad Spec (JSON/TS)] ----+
                        |---> [ Constraint Resolver Engine ] ---> [ Resolved Layout Output ]
[Surface Profile]   ----+          (src/resolver.ts)              (Position/Size/Visibility)
                                                                            |
                                                               +------------+------------+
                                                               |                         |
                                                               v                         v
                                                     [ DOM / CSS Renderer ]   [ Canvas 2D Backend ]
```

### 1. Domain Types (`src/types.ts`)
Defines the core data contracts:
- `AdElement`: Single content block (text, image, button, badge) with role, priority, and content metadata.
- `AdSpec`: Container for complete ad content specification.
- `SurfaceProfile`: Physical and interactive surface constraints (`width`, `height`, `safeArea`, `minTapTarget`, `minTextSize`, `touchOnly`).
- `ResolvedLayout`: Pure, framework-agnostic geometric layout definition containing bounding box coordinates `(x, y, width, height)` and font sizes for all elements.

### 2. Constraint Resolver (`src/resolver.ts`)
Pure TypeScript engine containing the constraint resolution algorithm:
- No reliance on DOM, React, or browser APIs (runs in Node.js, Web Workers, or server-side).
- Performs safe area insets, aspect ratio orientation classification, space budgeting, priority-based degradation, and non-overlapping geometric placement.

### 3. Rendering Layer (`src/render-dom.tsx` & `src/render-canvas.tsx`)
Separated rendering components:
- **DOM Renderer**: Renders absolute-positioned HTML elements styled with CSS.
- **Canvas Renderer**: Draws elements directly to an HTML5 2D Canvas context.
- Both renderers consume the exact same `ResolvedLayout` payload.

---

## 🔄 Data Flow Sequence

```
User selects Surface / Tweaks Custom Inputs
                     │
                     ▼
       App Component (src/App.tsx)
                     │
                     ▼
       resolveLayout(adSpec, surface)
                     │
                     ├─► 1. Inset Safe Area
                     ├─► 2. Classify Orientation (Portrait/Landscape/Square)
                     ├─► 3. Enforce Min Tap Target & Min Text Size
                     ├─► 4. Run Priority Degradation Loop (P3 -> P2 -> P1)
                     └─► 5. Compute Non-Overlapping Bounding Boxes
                     │
                     ▼
             ResolvedLayout Payload
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   <RenderDom />         <RenderCanvas />
```
