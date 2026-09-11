import { describe, it, expect } from 'vitest';
import { resolveLayout } from './resolver';
import { sampleAdSpec } from './spec';
import { presetSurfaces } from './surfaces';

describe('Constraint Resolution Engine', () => {
  it('resolves layouts for all preset surface profiles without throwing', () => {
    for (const surface of Object.values(presetSurfaces)) {
      const layout = resolveLayout(sampleAdSpec, surface);
      expect(layout).toBeDefined();
      expect(layout.surface.id).toBe(surface.id);
      expect(layout.elements.length).toBeGreaterThan(0);
      expect(layout.resolutionTimeMs).toBeGreaterThanOrEqual(0);
    }
  });


  it('guarantees zero overlapping bounding boxes for visible elements', () => {
    const layout = resolveLayout(sampleAdSpec, presetSurfaces.mobilePortrait);
    const visibleElements = layout.elements.filter(e => e.visible);

    for (let i = 0; i < visibleElements.length; i++) {
      for (let j = i + 1; j < visibleElements.length; j++) {
        const a = visibleElements[i];
        const b = visibleElements[j];

        const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;

        const overlaps = overlapsX && overlapsY;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('enforces minTextSize constraints for far viewing distance surfaces', () => {
    const layout = resolveLayout(sampleAdSpec, presetSurfaces.broadcastLowerThird);
    const minText = presetSurfaces.broadcastLowerThird.minTextSize || 32;

    const visibleTexts = layout.elements.filter(e => e.visible && (e.type === 'text' || e.type === 'button'));
    for (const el of visibleTexts) {
      expect(el.fontSize).toBeGreaterThanOrEqual(minText);
    }
  });

  it('enforces minTapTarget constraints for touch-only surfaces', () => {
    const layout = resolveLayout(sampleAdSpec, presetSurfaces.squareKiosk);
    const minTap = presetSurfaces.squareKiosk.minTapTarget || 60;

    const ctaButton = layout.elements.find(e => e.type === 'button' && e.visible);
    expect(ctaButton).toBeDefined();
    expect(ctaButton!.height).toBeGreaterThanOrEqual(minTap);
  });

  it('executes priority-based degradation on space-constrained surfaces', () => {
    const layout = resolveLayout(sampleAdSpec, presetSurfaces.microBanner);

    // Priority 1 elements should remain visible
    const headline = layout.elements.find(e => e.id === 'headline');
    expect(headline).toBeDefined();
    expect(headline!.visible).toBe(true);

    // Priority 3 optional elements should drop before Priority 1
    const p3Elements = layout.elements.filter(e => e.priority === 3);
    const droppedP3 = p3Elements.filter(e => !e.visible);

    expect(droppedP3.length).toBeGreaterThan(0);
    expect(layout.degradationLog.length).toBeGreaterThan(0);
  });

  it('dynamically adapts orientation classification based on aspect ratio', () => {
    const portraitLayout = resolveLayout(sampleAdSpec, presetSurfaces.mobilePortrait);
    expect(portraitLayout.orientation).toBe('portrait');

    const landscapeLayout = resolveLayout(sampleAdSpec, presetSurfaces.broadcastLowerThird);
    expect(landscapeLayout.orientation).toBe('landscape');

    const squareLayout = resolveLayout(sampleAdSpec, presetSurfaces.squareKiosk);
    expect(squareLayout.orientation).toBe('square');
  });
});
