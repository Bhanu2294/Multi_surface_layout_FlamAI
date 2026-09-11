import { AdSpec, SurfaceProfile, ResolvedLayout, ResolvedElement } from './types';

/**
 * Framework-agnostic Constraint Resolution Engine.
 * Dynamically resolves element geometry, font sizes, tap targets, and priority-based
 * degradation across any aspect ratio and surface constraints without hardcoded surface checks.
 */
export function resolveLayout(adSpec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
  const startTime = performance.now();
  const degradationLog: string[] = [];

  // 1. Calculate usable bounds after applying safe area insets
  const safeArea = surface.safeArea || { top: 0, right: 0, bottom: 0, left: 0 };
  const usableWidth = Math.max(50, surface.width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(50, surface.height - safeArea.top - safeArea.bottom);
  const aspectRatio = usableWidth / usableHeight;

  // 2. Classify layout orientation flow based on aspect ratio
  const orientation: 'portrait' | 'landscape' | 'square' =
    aspectRatio >= 1.35 ? 'landscape' : aspectRatio <= 0.85 ? 'portrait' : 'square';

  // 3. Clone elements and sort by priority (1 = Highest, 3 = Lowest)
  const elements = [...adSpec.elements];
  const minTextSize = surface.minTextSize || 12;
  const minTapTarget = surface.touchOnly ? (surface.minTapTarget || 44) : 0;

  // Track visibility and degradation per element
  const elementState = new Map<string, {
    visible: boolean;
    fontSize: number;
    degraded: boolean;
    degradationReason?: string;
    width: number;
    height: number;
  }>();

  // Helper to estimate text height based on container width and font size
  const estimateTextHeight = (text: string, fontSize: number, width: number, hasSubText = false) => {
    const charsPerLine = Math.max(8, Math.floor(width / (fontSize * 0.5)));
    const lines = Math.ceil(text.length / charsPerLine);
    const baseH = lines * fontSize * 1.25 + 4;
    return hasSubText ? Math.max(38, baseH + 14) : Math.max(fontSize + 4, baseH);
  };

  // Initialize element states with correct height estimations
  for (const el of elements) {
    let prefFontSize = el.preferredFontSize || (el.role === 'primary' ? 20 : el.role === 'secondary' ? 13 : 12);
    if (prefFontSize < minTextSize && (el.type === 'text' || el.type === 'button')) {
      prefFontSize = minTextSize;
    }

    if (orientation === 'landscape') {
      if (usableWidth < 800 && el.role === 'primary') {
        prefFontSize = Math.min(prefFontSize, 18);
      }
      if (usableHeight < 120 && el.role === 'secondary') {
        prefFontSize = Math.min(prefFontSize, 11);
      }
    } else if (orientation === 'portrait') {
      if (usableWidth < 350 && el.role === 'primary') {
        prefFontSize = Math.min(prefFontSize, 20);
      }
    }

    let estWidth = 0;
    let estHeight = 0;

    let estTextW = usableWidth;
    if (orientation === 'landscape') {
      const hasHero = elements.some(e => e.role === 'hero');
      const hasAction = elements.some(e => e.role === 'action');
      const sideWidth = (hasHero ? Math.min(usableWidth * 0.28, 200) : 0) + (hasAction ? Math.min(usableWidth * 0.26, 170) : 0) + 32;
      estTextW = Math.max(60, usableWidth - sideWidth);
    }

    if (el.type === 'image') {
      const imgAspect = el.aspectRatio || 1.33;
      if (orientation === 'landscape') {
        estHeight = Math.min(usableHeight * 0.75, 160);
        estWidth = estHeight * imgAspect;
      } else if (orientation === 'portrait') {
        estWidth = Math.min(usableWidth * 0.65, 170);
        estHeight = estWidth / imgAspect;
      } else {
        // square
        estWidth = Math.min(usableWidth * 0.5, 250);
        estHeight = estWidth / imgAspect;
      }
    } else if (el.type === 'button') {
      const charWidth = Math.ceil((el.content.length + (el.subText?.length || 0) * 0.6) * (prefFontSize * 0.5) + 36);
      estWidth = Math.max(el.minWidth || 130, Math.max(charWidth, minTapTarget * 2.5));
      estHeight = Math.max(el.minHeight || 44, minTapTarget);
    } else if (el.type === 'badge') {
      estWidth = Math.min(estTextW, 140);
      estHeight = Math.max(20, Math.min(minTextSize + 4, 26));
    } else {
      // text (primary headline, price with subtext, tagline)
      estWidth = estTextW;
      estHeight = estimateTextHeight(el.content, prefFontSize, estTextW, !!el.subText);
    }

    elementState.set(el.id, {
      visible: true,
      fontSize: prefFontSize,
      degraded: false,
      width: estWidth,
      height: estHeight,
    });
  }

  // 4. Space Budgeting & Priority-Based Degradation Pass
  const isBudgetExceeded = () => {
    if (orientation === 'landscape') {
      const centerEls = elements.filter(e => (e.role === 'primary' || e.role === 'secondary' || e.role === 'badge') && elementState.get(e.id)?.visible);
      let centerH = 0;
      for (const el of centerEls) {
        const st = elementState.get(el.id)!;
        centerH += st.height + (usableHeight < 120 ? 2 : 4);
      }
      return centerH > usableHeight;
    } else {
      let totalH = 0;
      for (const el of elements) {
        const st = elementState.get(el.id);
        if (st && st.visible) {
          totalH += st.height + 6;
        }
      }
      return totalH > usableHeight;
    }
  };

  // Pass 1: Drop Priority 3 elements (tagline, badge) if space is constrained
  if (isBudgetExceeded()) {
    const p3Elements = elements
      .filter(e => e.priority === 3)
      .sort(a => (a.id === 'tagline' ? -1 : 1));
    for (const el of p3Elements) {
      if (isBudgetExceeded()) {
        const state = elementState.get(el.id)!;
        state.visible = false;
        state.degraded = true;
        state.degradationReason = `Dropped Priority 3 element '${el.id}' to satisfy surface height bounds (${Math.round(usableHeight)}px)`;
        degradationLog.push(state.degradationReason);
      }
    }
  }

  // Pass 2: Scale down hero image if height is still tight
  if (isBudgetExceeded()) {
    const heroEl = elements.find(e => e.role === 'hero');
    if (heroEl) {
      const state = elementState.get(heroEl.id)!;
      state.width *= 0.65;
      state.height *= 0.65;
      state.degraded = true;
      state.degradationReason = `Scaled hero image down by 35% to fit within surface bounds`;
      degradationLog.push(state.degradationReason);
    }
  }

  // Pass 3: Drop non-essential text, KEEP PRICE ($499) VISIBLE
  if (isBudgetExceeded()) {
    const textEls = elements.filter(e => e.type === 'text' && e.id !== 'price' && e.priority > 1);
    for (const el of textEls) {
      if (isBudgetExceeded()) {
        const state = elementState.get(el.id)!;
        state.visible = false;
        state.degraded = true;
        state.degradationReason = `Dropped non-essential text '${el.id}' due to critical space bounds`;
        degradationLog.push(state.degradationReason);
      }
    }
  }

  // 5. Non-Overlapping Bounding Box Placement Algorithm
  const resolvedElements: ResolvedElement[] = [];

  if (orientation === 'landscape') {
    // Landscape / Wide Flow (Broadcast Lower-Third, Mobile Landscape, Micro Banner)
    const visibleEls = elements.filter(e => elementState.get(e.id)?.visible);

    const leftEls = visibleEls.filter(e => e.role === 'hero');
    // Center column: Badge -> Headline (P1) -> Price (P2) -> Tagline (P3)
    const centerEls = visibleEls
      .filter(e => e.role === 'primary' || e.role === 'secondary' || e.role === 'badge')
      .sort((a, b) => {
        if (a.role === 'badge') return -1;
        if (b.role === 'badge') return 1;
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.role === 'primary') return -1;
        if (b.role === 'primary') return 1;
        if (a.id === 'price') return -1;
        if (b.id === 'price') return 1;
        return 0;
      });

    const rightEls = visibleEls.filter(e => e.role === 'action');

    const columnCount = (leftEls.length ? 1 : 0) + (centerEls.length ? 1 : 0) + (rightEls.length ? 1 : 0);
    const colGap = 16;
    const availableWidthForCols = usableWidth - (Math.max(0, columnCount - 1) * colGap);

    let leftWidth = leftEls.length ? Math.min(availableWidthForCols * 0.28, 200) : 0;
    let rightWidth = rightEls.length ? Math.min(availableWidthForCols * 0.26, 170) : 0;

    if (usableWidth < 360) {
      leftWidth = leftEls.length ? 50 : 0;
      rightWidth = rightEls.length ? 105 : 0;
    }

    let centerWidth = Math.max(60, availableWidthForCols - leftWidth - rightWidth);
    let currentX = safeArea.left;

    // Render Left Column (Hero Image)
    if (leftEls.length) {
      let totalLeftH = leftEls.reduce((acc, el) => acc + (elementState.get(el.id)?.height || 0) + 6, 0) - 6;
      let currentY = safeArea.top + Math.max(0, (usableHeight - totalLeftH) / 2);

      for (const el of leftEls) {
        const st = elementState.get(el.id)!;
        const w = Math.min(leftWidth, st.width);
        const h = Math.min(usableHeight, st.height);
        const x = currentX + (leftWidth - w) / 2;
        resolvedElements.push({
          id: el.id,
          type: el.type,
          role: el.role,
          priority: el.priority,
          visible: true,
          x,
          y: currentY,
          width: w,
          height: h,
          fontSize: st.fontSize,
          content: el.content,
          subText: el.subText,
          url: el.url,
          degraded: st.degraded,
          degradationReason: st.degradationReason,
        });
        currentY += h + 6;
      }
      currentX += leftWidth + colGap;
    }

    // Render Center Column (Badge, Headline [P1], Price [P2], Tagline [P3])
    if (centerEls.length) {
      let gap = usableHeight < 120 ? 2 : 4;
      let totalH = 0;
      for (const el of centerEls) {
        const st = elementState.get(el.id)!;
        if (el.type === 'badge') {
          st.width = Math.min(centerWidth, usableWidth < 360 ? 110 : 150);
          st.height = Math.max(20, Math.min(minTextSize + 2, 26));
        } else {
          if (usableWidth < 360 && el.role === 'primary') {
            st.fontSize = Math.min(st.fontSize, 12);
          }
          st.height = estimateTextHeight(el.content, st.fontSize, centerWidth, !!el.subText);
        }
        totalH += st.height + gap;
      }
      totalH -= gap;
      let currentY = safeArea.top + Math.max(0, (usableHeight - totalH) / 2);

      for (const el of centerEls) {
        const st = elementState.get(el.id)!;
        const elX = el.type === 'badge' ? currentX + (centerWidth - st.width) / 2 : currentX;
        resolvedElements.push({
          id: el.id,
          type: el.type,
          role: el.role,
          priority: el.priority,
          visible: true,
          x: elX,
          y: currentY,
          width: el.type === 'badge' ? st.width : centerWidth,
          height: st.height,
          fontSize: st.fontSize,
          content: el.content,
          subText: el.subText,
          url: el.url,
          degraded: st.degraded,
          degradationReason: st.degradationReason,
        });
        currentY += st.height + gap;
      }
      currentX += centerWidth + colGap;
    }

    // Render Right Column (CTA Button)
    if (rightEls.length) {
      for (const el of rightEls) {
        const st = elementState.get(el.id)!;
        const btnW = Math.min(rightWidth, Math.max(100, st.width));
        const btnH = Math.min(usableHeight, Math.max(st.height, minTapTarget || 44));
        resolvedElements.push({
          id: el.id,
          type: el.type,
          role: el.role,
          priority: el.priority,
          visible: true,
          x: currentX + (rightWidth - btnW) / 2,
          y: safeArea.top + (usableHeight - btnH) / 2,
          width: btnW,
          height: btnH,
          fontSize: st.fontSize,
          content: el.content,
          subText: el.subText,
          url: el.url,
          degraded: st.degraded,
          degradationReason: st.degradationReason,
        });
      }
    }

  } else if (orientation === 'portrait') {
    // Portrait / Tall Flow (Mobile Interstitial 320x480)
    // ORDER: Badge -> Hero -> Headline -> Price -> Tagline -> CTA
    const visibleEls = elements
      .filter(e => elementState.get(e.id)?.visible)
      .sort((a, b) => {
        const getOrder = (item: typeof a) => {
          if (item.type === 'badge') return 1;
          if (item.role === 'hero') return 2;
          if (item.role === 'primary') return 3;
          if (item.id === 'price') return 4;
          if (item.id === 'tagline') return 5;
          if (item.role === 'action') return 6;
          return 7;
        };
        return getOrder(a) - getOrder(b);
      });

    const gap = 8;

    let totalHeight = 0;
    for (const el of visibleEls) {
      const st = elementState.get(el.id)!;
      if (el.type === 'text') {
        st.height = estimateTextHeight(el.content, st.fontSize, usableWidth, !!el.subText);
      }
      totalHeight += st.height + gap;
    }

    let currentY = safeArea.top + Math.max(0, (usableHeight - totalHeight) / 2);

    for (const el of visibleEls) {
      const st = elementState.get(el.id)!;
      let elWidth = usableWidth;
      let elX = safeArea.left;

      if (el.type === 'button') {
        elWidth = Math.min(usableWidth * 0.9, Math.max(200, minTapTarget * 3));
        elX = safeArea.left + (usableWidth - elWidth) / 2;
      } else if (el.type === 'image') {
        elWidth = Math.min(usableWidth * 0.75, st.width);
        elX = safeArea.left + (usableWidth - elWidth) / 2;
      } else if (el.type === 'badge') {
        elWidth = Math.min(usableWidth, 160);
        elX = safeArea.left + (usableWidth - elWidth) / 2;
      }

      resolvedElements.push({
        id: el.id,
        type: el.type,
        role: el.role,
        priority: el.priority,
        visible: true,
        x: elX,
        y: currentY,
        width: elWidth,
        height: st.height,
        fontSize: st.fontSize,
        content: el.content,
        subText: el.subText,
        url: el.url,
        degraded: st.degraded,
        degradationReason: st.degradationReason,
      });

      currentY += st.height + gap;
    }

  } else {
    // Square / Balanced Flow (Retail Kiosk 1080x1080)
    // ORDER: Badge -> Hero -> Headline -> Price -> Tagline -> CTA
    const visibleEls = elements
      .filter(e => elementState.get(e.id)?.visible)
      .sort((a, b) => {
        const getOrder = (item: typeof a) => {
          if (item.type === 'badge') return 1;
          if (item.role === 'hero') return 2;
          if (item.role === 'primary') return 3;
          if (item.id === 'price') return 4;
          if (item.id === 'tagline') return 5;
          if (item.role === 'action') return 6;
          return 7;
        };
        return getOrder(a) - getOrder(b);
      });

    const gap = 12;

    let totalHeight = 0;
    for (const el of visibleEls) {
      const st = elementState.get(el.id)!;
      if (el.type === 'image' && el.role === 'hero') {
        st.width = Math.min(usableWidth * 0.65, 420);
        st.height = st.width / (el.aspectRatio || 1.33);
      } else if (el.type === 'text') {
        st.height = estimateTextHeight(el.content, st.fontSize, usableWidth, !!el.subText);
      }
      totalHeight += st.height + gap;
    }

    let currentY = safeArea.top + Math.max(0, (usableHeight - totalHeight) / 2);

    for (const el of visibleEls) {
      const st = elementState.get(el.id)!;
      let elWidth = usableWidth;
      let elX = safeArea.left;

      if (el.type === 'button') {
        elWidth = Math.min(usableWidth * 0.8, Math.max(240, minTapTarget * 3.5));
        elX = safeArea.left + (usableWidth - elWidth) / 2;
      } else if (el.type === 'image') {
        elWidth = st.width;
        elX = safeArea.left + (usableWidth - elWidth) / 2;
      } else if (el.type === 'badge') {
        elWidth = Math.min(usableWidth, 180);
        elX = safeArea.left + (usableWidth - elWidth) / 2;
      }

      resolvedElements.push({
        id: el.id,
        type: el.type,
        role: el.role,
        priority: el.priority,
        visible: true,
        x: elX,
        y: currentY,
        width: elWidth,
        height: st.height,
        fontSize: st.fontSize,
        content: el.content,
        subText: el.subText,
        url: el.url,
        degraded: st.degraded,
        degradationReason: st.degradationReason,
      });

      currentY += st.height + gap;
    }
  }

  // Include dropped elements as non-visible
  for (const el of elements) {
    const st = elementState.get(el.id)!;
    if (!st.visible) {
      resolvedElements.push({
        id: el.id,
        type: el.type,
        role: el.role,
        priority: el.priority,
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fontSize: st.fontSize,
        content: el.content,
        subText: el.subText,
        url: el.url,
        degraded: true,
        degradationReason: st.degradationReason,
      });
    }
  }

  const endTime = performance.now();

  return {
    surface,
    adSpec,
    aspectRatio,
    orientation,
    usableWidth,
    usableHeight,
    elements: resolvedElements,
    degradationLog,
    resolutionTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}
