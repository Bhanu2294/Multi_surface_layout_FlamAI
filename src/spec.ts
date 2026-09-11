import { AdSpec } from './types';

/**
 * Type-safe helper to define an Ad Spec.
 * Enforces valid element structures, priorities, and unique element IDs.
 */
export function defineAd(spec: AdSpec): AdSpec {
  const ids = new Set<string>();
  for (const element of spec.elements) {
    if (ids.has(element.id)) {
      throw new Error(`Duplicate element ID '${element.id}' in AdSpec '${spec.id}'`);
    }
    ids.add(element.id);
  }
  return spec;
}

export const sampleAdSpec: AdSpec = defineAd({
  id: 'flam-ar-glasses-v1',
  title: 'Flam Spatial AR Glasses Launch Ad',
  brandName: 'FLAM',
  elements: [
    {
      id: 'badge',
      type: 'badge',
      role: 'badge',
      priority: 3,
      content: 'NEW RELEASE 2026',
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: 'Flam Glass X Pro',
      url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 1.33,
      minWidth: 100,
      minHeight: 80,
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: 'Step into Spatial Reality',
      preferredFontSize: 24,
    },
    {
      id: 'price',
      type: 'text',
      role: 'secondary',
      priority: 2,
      content: '$499',
      subText: 'Limited Launch Price',
      preferredFontSize: 20,
    },
    {
      id: 'tagline',
      type: 'text',
      role: 'secondary',
      priority: 3,
      content: 'Next-gen holographic display for seamless 3D experiences anywhere.',
      preferredFontSize: 14,
    },
    {
      id: 'cta',
      type: 'button',
      role: 'action',
      priority: 2,
      content: 'Pre-Order Now',
      subText: 'Free Worldwide Shipping',
      minWidth: 120,
      minHeight: 44,
    },
  ],
});
