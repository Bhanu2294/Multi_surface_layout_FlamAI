export type ElementType = 'text' | 'image' | 'button' | 'badge';
export type ElementRole = 'hero' | 'primary' | 'secondary' | 'action' | 'branding' | 'badge';
export type ElementPriority = 1 | 2 | 3; // 1 = Highest, 3 = Lowest

export interface AdElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  priority: ElementPriority;
  content: string;
  subText?: string;
  url?: string;
  aspectRatio?: number; // width / height for images
  minWidth?: number;
  minHeight?: number;
  preferredFontSize?: number;
}

export interface AdSpec {
  id: string;
  title: string;
  brandName: string;
  elements: AdElement[];
}

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SurfaceProfile {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  safeArea?: SafeArea;
  minTapTarget?: number; // e.g. 44px for touch
  minTextSize?: number;  // e.g. 32px for broadcast far viewing
  viewingDistance?: 'near' | 'medium' | 'far';
  touchOnly?: boolean;
  theme?: 'dark' | 'light' | 'vibrant';
}

export interface ResolvedElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  priority: ElementPriority;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  content: string;
  subText?: string;
  url?: string;
  degraded: boolean;
  degradationReason?: string;
}

export interface ResolvedLayout {
  surface: SurfaceProfile;
  adSpec: AdSpec;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  usableWidth: number;
  usableHeight: number;
  elements: ResolvedElement[];
  degradationLog: string[];
  resolutionTimeMs: number;
}
